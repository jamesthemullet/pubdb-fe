type StaticImageData = {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
};

declare module "leaflet/dist/images/marker-icon.png" {
  const value: StaticImageData;
  export default value;
}

declare module "leaflet/dist/images/marker-icon-2x.png" {
  const value: StaticImageData;
  export default value;
}

declare module "leaflet/dist/images/marker-shadow.png" {
  const value: StaticImageData;
  export default value;
}
