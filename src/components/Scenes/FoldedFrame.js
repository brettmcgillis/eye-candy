function FoldedFrame({ ...props }) {
  const layers = [];

  return (
    <group {...props}>
      {layers.map((layer, i) => {
        <></>;
      })}
    </group>
  );
}

export default FoldedFrame;
