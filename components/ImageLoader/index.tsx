import { Image } from "expo-image";

function ImageLoader({ ...props }) {
  return (
    <Image
      style={{
        width: "100%",
        flex: 1,
        aspectRatio: props.aspectRatio,
        height: props.style?.height,
        minHeight: props.style?.minHeight,
        maxHeight: props.style?.maxHeight,
        borderRadius: props.style?.borderRadius,
      }}
      contentFit={props.contentFit || "cover"}
      transition={props.noAnimation ? 0 : 1000}
      placeholder={{ blurhash: props.blurhash }}
      source={props.source}
    />
  );
}

export default ImageLoader;
