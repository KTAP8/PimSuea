from __future__ import annotations

import shutil
import threading
import time
from pathlib import Path

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)

from . import annotate_service, orders as orders_svc, products as products_svc
from .config import (
    BACKEND_ENV,
    COLOR_CATEGORIES,
    OPS_HOST,
    OPS_PORT,
    ORDER_STATUSES,
    SHIRT_SIZES,
    TEMPLATE_SIDES,
    TOOLS_ENV,
    config_errors,
    is_configured,
)

PAGES_DIR = Path(__file__).resolve().parent / "pages"
STATIC_DIR = Path(__file__).resolve().parent / "static"

app = Flask(
    __name__,
    template_folder=str(PAGES_DIR),
    static_folder=str(STATIC_DIR),
    static_url_path="/static",
)
app.secret_key = "pimsuea-local-ops-dev-only"

_print_sessions: dict[str, dict] = {}
_print_lock = threading.Lock()
SESSION_TTL_SEC = 3600


def _cleanup_sessions() -> None:
    now = time.time()
    with _print_lock:
        expired = [sid for sid, meta in _print_sessions.items() if now - meta["created"] > SESSION_TTL_SEC]
        for sid in expired:
            meta = _print_sessions.pop(sid, None)
            if meta and meta.get("work_dir"):
                shutil.rmtree(meta["work_dir"], ignore_errors=True)


@app.context_processor
def inject_globals():
    return {
        "order_statuses": ORDER_STATUSES,
        "shirt_sizes": SHIRT_SIZES,
        "color_categories": COLOR_CATEGORIES,
        "template_sides": TEMPLATE_SIDES,
    }


@app.before_request
def check_config():
    if request.endpoint in (None, "static", "setup"):
        return None
    if not is_configured():
        return redirect(url_for("setup"))


@app.get("/setup")
def setup():
    return render_template(
        "setup.html",
        missing=config_errors(),
        backend_env=str(BACKEND_ENV),
        tools_env=str(TOOLS_ENV),
        backend_exists=BACKEND_ENV.is_file(),
        tools_exists=TOOLS_ENV.is_file(),
    )


@app.get("/")
def index():
    if not is_configured():
        return redirect(url_for("setup"))
    return redirect(url_for("products_list"))


# ─── Products ────────────────────────────────────────────────────────────────

@app.get("/products")
def products_list():
    products = products_svc.list_products()
    return render_template("products_list.html", products=products)


@app.post("/products/clone")
def product_clone():
    source_id = request.form.get("source_id", "").strip()
    title = request.form.get("title", "").strip() or None
    if not source_id:
        flash("Select a product to clone.", "error")
        return redirect(url_for("products_list"))
    try:
        new_id = products_svc.clone_product(source_id, title)
        flash("Product cloned. Review and activate when ready.", "ok")
        return redirect(url_for("product_edit", product_id=new_id))
    except Exception as exc:
        flash(str(exc), "error")
        return redirect(url_for("products_list"))


@app.route("/products/<product_id>", methods=["GET", "POST"])
def product_edit(product_id: str):
    product = products_svc.get_product(product_id)
    if not product:
        flash("Product not found.", "error")
        return redirect(url_for("products_list"))

    if request.method == "POST":
        action = request.form.get("action", "save_meta")
        try:
            if action == "save_meta":
                products_svc.update_product_metadata(product_id, {
                    "title": request.form.get("title"),
                    "title_en": request.form.get("title_en") or None,
                    "details": request.form.get("details"),
                    "care_instructions": request.form.get("care_instructions"),
                    "is_active": request.form.get("is_active") == "on",
                    "is_beginner_friendly": request.form.get("is_beginner_friendly") == "on",
                    "category_id": request.form.get("category_id") or None,
                    "base_price": request.form.get("base_price") or None,
                    "min_price": request.form.get("min_price") or None,
                })
                method_ids = request.form.getlist("print_methods")
                products_svc.set_product_print_methods(product_id, method_ids)
                flash("Product saved.", "ok")

            elif action == "add_gallery":
                file = request.files.get("gallery_file")
                if file and file.filename:
                    url = products_svc.upload_catalog_asset(product_id, file, "gallery")
                    products_svc.upsert_gallery_image(
                        product_id,
                        url,
                        int(request.form.get("display_order", 0)),
                        request.form.get("is_hover") == "on",
                    )
                    flash("Gallery image added.", "ok")
                else:
                    url = request.form.get("gallery_url", "").strip()
                    if url:
                        products_svc.upsert_gallery_image(
                            product_id,
                            url,
                            int(request.form.get("display_order", 0)),
                            request.form.get("is_hover") == "on",
                        )
                        flash("Gallery image added.", "ok")

            elif action == "delete_gallery":
                products_svc.delete_gallery_image(request.form.get("image_id", ""))
                flash("Gallery image removed.", "ok")

            elif action == "save_template":
                products_svc.save_template(
                    product_id,
                    request.form.get("template_id") or None,
                    request.form,
                )
                flash("Template saved.", "ok")

            elif action == "delete_template":
                products_svc.delete_template(request.form.get("template_id", ""))
                flash("Template deleted.", "ok")

            elif action == "upload_template_image":
                file = request.files.get("template_file")
                side = request.form.get("side", "front")
                if file and file.filename:
                    url = products_svc.upload_catalog_asset(product_id, file, f"canvas/{side}")
                    flash(f"Uploaded canvas template: {url}", "ok")
                else:
                    flash("Choose a file to upload.", "error")

            elif action == "upload_mockup_image":
                file = request.files.get("mockup_file")
                side = request.form.get("side", "front")
                if file and file.filename:
                    url = products_svc.upload_catalog_asset(product_id, file, f"mockups/{side}")
                    flash(f"Uploaded mockup: {url}", "ok")
                else:
                    flash("Choose a file to upload.", "error")

            elif action == "save_pricing":
                products_svc.save_shirt_pricing_row(
                    product_id,
                    request.form.get("pricing_id") or None,
                    request.form,
                )
                flash("Pricing row saved.", "ok")

            elif action == "delete_pricing":
                products_svc.delete_shirt_pricing_row(request.form.get("pricing_id", ""))
                flash("Pricing row deleted.", "ok")

            elif action == "migrate_r2":
                counts = products_svc.migrate_product_assets_to_r2(product_id)
                flash(
                    f"Migrated to R2 — templates: {counts['templates']}, "
                    f"mockups: {counts['mockups']}, gallery: {counts['images']}",
                    "ok",
                )
        except Exception as exc:
            flash(str(exc), "error")

        return redirect(url_for("product_edit", product_id=product_id))

    return render_template(
        "product_edit.html",
        product=product,
        categories=products_svc.get_categories(),
        colors=products_svc.get_colors(),
        print_methods=products_svc.get_print_methods(),
        selected_print_methods=products_svc.get_product_print_methods(product_id),
        images=products_svc.get_product_images(product_id),
        templates=products_svc.get_product_templates(product_id),
        shirt_pricing=products_svc.get_shirt_pricing(product_id),
        r2_assets=products_svc.list_r2_assets(product_id),
    )


# ─── Orders ──────────────────────────────────────────────────────────────────

@app.get("/orders")
def orders_list():
    status = request.args.get("status") or None
    orders = orders_svc.list_orders(status)
    return render_template("orders_list.html", orders=orders, filter_status=status)


@app.route("/orders/<order_id>", methods=["GET", "POST"])
def order_detail(order_id: str):
    order = orders_svc.get_order(order_id)
    if not order:
        flash("Order not found.", "error")
        return redirect(url_for("orders_list"))

    if request.method == "POST":
        action = request.form.get("action", "update_status")
        try:
            if action == "update_status":
                orders_svc.update_order_status(
                    order_id,
                    request.form.get("status", order["status"]),
                    request.form.get("tracking_number"),
                )
                flash("Order updated.", "ok")
            elif action == "prepare_print":
                item_id = request.form.get("item_id", "")
                result = annotate_service.prepare_order_item_print(
                    order_id,
                    item_id,
                    show_tag=request.form.get("show_tag") == "on",
                    text_color=request.form.get("text_color", "black"),
                )
                _cleanup_sessions()
                with _print_lock:
                    _print_sessions[result["session_id"]] = {
                        "work_dir": result["work_dir"],
                        "files": {f["name"]: f["path"] for f in result["files"]},
                        "created": time.time(),
                    }
                return render_template(
                    "prepare_print.html",
                    order=order,
                    items=orders_svc.get_order_items(order_id),
                    customer_email=orders_svc.get_profile_email(order.get("user_id")),
                    print_result=result,
                )
            elif action == "update_shipment_tracking":
                shipment_id = request.form.get("shipment_id", "").strip()
                tracking = request.form.get("tracking_number")
                if shipment_id:
                    orders_svc.update_shipment_tracking(shipment_id, tracking)
                    flash("Shipment tracking updated.", "ok")
        except Exception as exc:
            flash(str(exc), "error")
        return redirect(url_for("order_detail", order_id=order_id))

    return render_template(
        "order_detail.html",
        order=order,
        items=orders_svc.get_order_items(order_id),
        shipments=orders_svc.get_order_shipments(order_id),
        customer_email=orders_svc.get_profile_email(order.get("user_id")),
    )


@app.get("/orders/<order_id>/packing-slip")
def packing_slip(order_id: str):
    order = orders_svc.get_order(order_id)
    if not order:
        flash("Order not found.", "error")
        return redirect(url_for("orders_list"))
    return render_template(
        "packing_slip.html",
        order=order,
        packing_groups=orders_svc.get_packing_data(order_id),
        buyer_address=order.get("shipping_address") or {},
        customer_email=orders_svc.get_profile_email(order.get("user_id")),
    )


@app.get("/download/<session_id>/<filename>")
def download_file(session_id: str, filename: str):
    if Path(filename).name != filename or ".." in filename:
        return "Invalid filename", 400
    with _print_lock:
        meta = _print_sessions.get(session_id)
    if not meta:
        return "Session expired", 404
    path = Path(meta["files"].get(filename, ""))
    if not path.is_file():
        return "File not found", 404
    mimetype = "image/tiff" if filename.lower().endswith((".tif", ".tiff")) else "image/png"
    return send_file(path, mimetype=mimetype, as_attachment=True, download_name=filename)


def main():
    print(f"PimSuea Ops → http://{OPS_HOST}:{OPS_PORT}")
    app.run(host=OPS_HOST, port=OPS_PORT, debug=False)


if __name__ == "__main__":
    main()
