interface Props {
    onConfirm: () => void;
    onCancel: () => void;
}

export function LeaveConfirmModal({ onConfirm, onCancel }: Props) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
                <h3 className="font-bold text-base mb-2">ออกโดยไม่บันทึก?</h3>
                <p className="text-sm text-gray-500 mb-5">การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป</p>
                <div className="flex gap-2 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">
                        อยู่ต่อ
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">
                        ออกเลย
                    </button>
                </div>
            </div>
        </div>
    );
}
