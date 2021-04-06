import Head from "next/head";
import { forwardRef, useEffect, useRef, useCallback } from "react";
import styles from "../styles/Home.module.css";
import draw from "canvas-free-drawing";
import loader from "@assemblyscript/loader";
import wasmSrc from "../build/code.wasm";

const useUpdatedRef = (value) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

const useEventCallback = (callback) => {
  const ref = useUpdatedRef(callback);
  return useCallback((arg) => ref.current && ref.current(arg), []);
};

const DA4 = forwardRef(({ id, crop }, ref) => {
  const cfdRef = useRef();
  const canvasRef = useRef();
  const cropCallback = useEventCallback(crop);

  useEffect(() => {
    const cfd = new draw({
      elementId: id,
      width: 595,
      height: 842,
    });
    cfdRef.current = cfd;
    ref.current = cfd.context;

    cfd.setLineWidth(5);

    canvasRef.current.addEventListener("cfd_mouseleave", cropCallback);
    canvasRef.current.addEventListener("cfd_mouseup", cropCallback);

    return () => {
      canvasRef.current.removeEventListener("cfd_mouseleave", cropCallback);
      canvasRef.current.removeEventListener("cfd_mouseup", cropCallback);
      cfd.toggleDrawingMode();
    };
  }, [id]);

  return <canvas id={id} className={styles.canvas} ref={canvasRef} />;
});

const byteSize = 2000 * 2000 * 4;
const memory = new WebAssembly.Memory({
  initial: ((byteSize + 0xffff) & ~0xffff) >>> 16,
});

const wasmPromise = loader.instantiate(fetch(wasmSrc), {
  env: {
    memory,
  },
});

const getCrop = async (imageData) => {
  const { data, width, height } = imageData;
  const wasm = await wasmPromise;

  const mem = new Uint8ClampedArray(memory.buffer);
  mem.set(data);
  const resultPtr = wasm.exports.crop(width, height);

  const [top, right, bottom, left] = wasm.exports.__getUint32Array(resultPtr);

  return {
    top,
    right,
    bottom,
    left,
  };
};

export default function Home({ id }) {
  const ctxRef = useRef();
  const borderRef = useRef();

  const crop = useCallback(async () => {
    const start = Date.now();
    const ctx = ctxRef.current;

    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    const { top, right, bottom, left } = await getCrop(imageData);

    console.log(`Time: ${Date.now() - start} ms`);

    console.log({
      top,
      right,
      bottom,
      left,
    });

    const border = borderRef.current;

    border.style.top = `${top}px`;
    border.style.left = `${left}px`;
    border.style.width = `${right - left + 1}px`;
    border.style.height = `${bottom - top + 1}px`;
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <button
          className={styles.button}
          onClick={() => {
            ctxRef.current.fillStyle = "white";
            ctxRef.current.fillRect(
              0,
              0,
              ctxRef.current.canvas.width,
              ctxRef.current.canvas.height
            );

            const border = borderRef.current;
            border.style.top = "";
            border.style.left = "";
            border.style.width = "";
            border.style.height = "";
          }}
        >
          {"clear"}
        </button>

        <div className={styles.relative}>
          <DA4 id={id} ref={ctxRef} crop={crop} />
          <div ref={borderRef} className={styles.border} />
        </div>
      </main>
    </div>
  );
}

export const getStaticProps = () => ({
  props: {
    id: `canvas${Math.random()}`,
  },
});
