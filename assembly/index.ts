export function crop(
  arr: Uint8ClampedArray,
  width: u32,
  height: u32
): Array<u32> {
  // [top, right, bottom, left]
  let result: Array<u32> = [height, 0, 0, width];

  for (let y: u32 = 0; y < height; ++y) {
    for (let x: u32 = 0; x < width; ++x) {
      const pos: u32 = (y * width + x) * 4;

      if (arr[pos] !== 255 || arr[pos + 1] !== 255 || arr[pos + 2] !== 255) {
        // [top, right, bottom, left]
        result = [
          min(result[0], y),
          max(x, result[1]),
          max(result[2], y),
          min(result[3], x),
        ];
      }
    }
  }

  return result;
}

export const arrayPtr = idof<Uint8ClampedArray>();
