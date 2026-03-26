export interface CanvasImage {
    id: string;
    image: HTMLImageElement;
    src: string; // original URL (for serialization)
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SidePriceBreakdown {
    side: string;
    tier: string;
    print_per_unit: number;
}

export interface CanvasPriceBreakdown {
    sides: SidePriceBreakdown[];
    shirt_per_unit: number;
    total_print_per_unit: number;
    total_per_unit: number;
}

export type SerializableImage = {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
};
