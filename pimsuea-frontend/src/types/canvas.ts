export interface CanvasImage {
    id: string;
    image: HTMLImageElement;
    src: string; // original URL (for serialization)
    x: number;
    y: number;
    width: number;
    height: number;
}

export type SerializableImage = {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
};
