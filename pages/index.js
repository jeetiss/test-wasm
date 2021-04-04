import Head from "next/head";
import { forwardRef, useEffect, useReducer, useRef } from "react";
import styles from "../styles/Home.module.css";
import draw from "canvas-free-drawing";
import loader from "@assemblyscript/loader";
import wasmSrc from "../build/untouched.wasm";

const DA4 = forwardRef(({ id, disabled }, ref) => {
  const cfdRef = useRef();

  useEffect(() => {
    const cfd = new draw({
      elementId: id,
      width: 595,
      height: 842,
    });
    cfdRef.current = cfd;
    ref.current = cfd.context;

    cfd.setLineWidth(5);
    return () => {
      cfd.toggleDrawingMode();
    };
  }, [id]);

  useEffect(() => {
    if (disabled === cfdRef.current.isDrawingModeEnabled) {
      cfdRef.current.toggleDrawingMode();
      console.log("toggleDrawingMode");
    }

    if (!disabled) cfdRef.current.clear();
  }, [disabled]);

  return <canvas id={id} className={styles.canvas} />;
});

const getCrop = async (imageData) => {
  const { data, width, height } = imageData;
  const byteSize = width * height * 4;

  const memory = new WebAssembly.Memory({
    initial: ((byteSize + 0xffff) & ~0xffff) >>> 16,
  });

  const mem = new Uint8ClampedArray(memory.buffer);
  mem.set(data);

  const wasm = await loader.instantiate(fetch(wasmSrc), {
    env: {
      memory,
    },
  });

  const resultPtr = wasm.exports.crop(width, height);

  const [top, right, bottom, left] = wasm.exports.__getUint32Array(resultPtr);

  return {
    top,
    right,
    bottom,
    left,
  };
};

const SIZE = 1;

export default function Home({ id }) {
  const [mode, toggle] = useReducer((v) => !v);
  const ctxRef = useRef();

  useEffect(() => {
    (async () => {
      if (mode) {
        const start = Date.now();
        const ctx = ctxRef.current;

        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        tempCanvas.width = ctx.canvas.width / SIZE;
        tempCanvas.height = ctx.canvas.height / SIZE;

        tempCtx.drawImage(
          ctx.canvas,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );

        const imageData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );

        const { top, right, bottom, left } = await getCrop(imageData);

        console.log({
          top,
          right,
          bottom,
          left,
        });

        ctx.strokeStyle = "green";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          left * SIZE,
          top * SIZE,
          (right - left) * SIZE,
          (bottom - top) * SIZE
        );

        console.log(`Time: ${(Date.now() - start) / 1000} sec`);
      }
    })();
  }, [mode]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <button className={styles.button} onClick={toggle}>
          {mode ? "draw" : "crop"}
        </button>

        <DA4 id={id} ref={ctxRef} disabled={mode} />
      </main>
    </div>
  );
}

export const getStaticProps = () => ({
  props: {
    id: `canvas${Math.random()}`,
  },
});
