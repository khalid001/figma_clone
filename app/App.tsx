"use client";

import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import RightSidebar from "@/components/RightSidebar";
import { defaultNavElement } from "@/constants";
import { initializeFabric, handleCanvasMouseDown, handleCanvaseMouseMove, handleCanvasMouseUp, handlePathCreated, handleCanvasObjectModified, handleCanvasObjectMoving, handleCanvasSelectionCreated, handleCanvasObjectScaling, handleCanvasZoom, handleResize, renderCanvas } from "@/lib/canvas";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";
import { ActiveElement } from "@/types/type";
import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";

// Add this interface
interface CustomAttributes {
  width: string;
  height: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  stroke: string;
}

const Home = () => {
  const [canvasObjects, setCanvasObjects] = useState(new Map());
  const [history, setHistory] = useState<Array<any>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const isEditingRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });
  const [elementAttributes, setElementAttributes] = useState<CustomAttributes>({
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "#aabbcc",
    stroke: "#aabbcc",
  });

  const undo = () => {
    console.log('Attempting Undo - Current Index:', historyIndex);
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousState = history[historyIndex - 1];
      fabricRef.current?.loadFromJSON(previousState, () => {
        fabricRef.current?.renderAll();
      });
      console.log('Undo Successful - New Index:', historyIndex - 1);
    } else {
      console.log('Cannot Undo - At earliest state');
    }
  };

  const redo = () => {
    console.log('Attempting Redo - Current Index:', historyIndex);
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextState = history[historyIndex + 1];
      fabricRef.current?.loadFromJSON(nextState, () => {
        fabricRef.current?.renderAll();
      });
      console.log('Redo Successful - New Index:', historyIndex + 1);
    } else {
      console.log('Cannot Redo - At latest state');
    }
  };

  const updateCanvasObject = (object: fabric.Object) => {
    console.log('Updating Canvas Object:', object);
    if (!object) {
      console.warn('Attempted to update null object');
      return;
    }
    const objectId = (object as any).objectId; 
    const shapeData: any = object.toJSON();
    shapeData.objectId = objectId;
    
    setCanvasObjects(prev => {
      const newMap = new Map(prev);
      newMap.set(objectId, shapeData);
      return newMap;
    });

    // Add to history
    const currentState = fabricRef.current?.toJSON();
    setHistory(prev => [...prev.slice(0, historyIndex + 1), currentState]);
    setHistoryIndex(prev => prev + 1);
    console.log('Canvas Object Updated Successfully');
  };

  const deleteShapeFromStorage = (shapeId: string) => {
    setCanvasObjects(prev => {
      const newMap = new Map(prev);
      newMap.delete(shapeId);
      return newMap;
    });

    // Add to history
    const currentState = fabricRef.current?.toJSON();
    setHistory(prev => [...prev.slice(0, historyIndex + 1), currentState]);
    setHistoryIndex(prev => prev + 1);
  };

  const deleteAllShapes = () => {
    setCanvasObjects(new Map());
    
    // Add to history
    const currentState = fabricRef.current?.toJSON();
    setHistory(prev => [...prev.slice(0, historyIndex + 1), currentState]);
    setHistoryIndex(prev => prev + 1);
  };

  /**
   * Set the active element in the navbar and perform the action based
   * on the selected element.
   */
  const handleActiveElement = (elem: ActiveElement) => {
    console.log('Active Element Changed:', elem);
    setActiveElement(elem);

    switch (elem?.value) {
      // delete all the shapes from the canvas
      case "reset":
        console.log('Resetting canvas...');
        deleteAllShapes();
        fabricRef.current?.clear();
        setActiveElement(defaultNavElement);
        break;

      // delete the selected shape from the canvas
      case "delete":
        console.log('Deleting selected object...');
        // delete it from the canvas
        handleDelete(fabricRef.current as any);
        // set "select" as the active element
        setActiveElement(defaultNavElement);
        break;

      case "image":
        imageInputRef.current?.click();
        isDrawing.current = false;
        if (fabricRef.current) {
          fabricRef.current.isDrawingMode = false;
        }
        break;

      default:
        // set the selected shape to the selected element
        selectedShapeRef.current = elem?.value as string;
        break;
    }
  };

  useEffect(() => {
    console.log('Initializing Canvas...');
    // initialize the fabric canvas
    const canvas = initializeFabric({
      canvasRef,
      fabricRef,
    });
    console.log('Canvas Initialized:', canvas);

    
    canvas.on("mouse:down", (options) => {
      console.log('Canvas Mouse Down:', options);
      handleCanvasMouseDown({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
      });
    });

    
    canvas.on("mouse:move", (options) => {
      // console.log('Canvas Mouse Move:', options);
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        selectedShapeRef,
        shapeRef,
        updateCanvasObject,
      });
    });

    
    canvas.on("mouse:up", () => {
      console.log('Canvas Mouse Up:');
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        activeObjectRef,
        selectedShapeRef,
        updateCanvasObject,
        setActiveElement,
      });
    });

    
    canvas.on("path:created", (options) => {
      console.log('Canvas Path created:', options);
      handlePathCreated({
        options,
        updateCanvasObject,
      });
    });

    
    canvas.on("object:modified", (options) => {
      console.log('Object Modified:', options);
      handleCanvasObjectModified({
        options,
        updateCanvasObject,
      });
    });

    
    canvas?.on("object:moving", (options) => {
      handleCanvasObjectMoving({
        options,
      });
    });

    
    canvas.on("selection:created", (options) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      });
    });

    canvas.on("object:scaling", (options) => {
      console.log('Canvas Object Scaling:', options);
      handleCanvasObjectScaling({
        options,
        setElementAttributes,
      });
    });

    canvas.on("mouse:wheel", (options) => {
      
      handleCanvasZoom({
        options,
        canvas,
      });
    });

    window.addEventListener("resize", () => {
      console.log('Window Resized:');
      handleResize({
        canvas: fabricRef.current,
      });
    });

    window.addEventListener("keydown", (e) => {
      console.log('Window Key Down:', e);
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        updateCanvasObject,
        deleteShapeFromStorage,
      })
    });

    // dispose the canvas and remove the event listeners when the component unmounts
    return () => {
      console.log('Disposing Canvas...');
      canvas.dispose();

      // remove the event listeners
      window.removeEventListener("resize", () => {
        handleResize({
          canvas: null,
        });
      });

      window.removeEventListener("keydown", (e) =>
        handleKeyDown({
          e,
          canvas: fabricRef.current,
          undo,
          redo,
          updateCanvasObject,
          deleteShapeFromStorage,
        })
      );
    };
  }, [canvasRef]);

  
  useEffect(() => {
    console.log('Rendering Canvas with Objects:', Array.from(canvasObjects.entries()));
  }, [canvasObjects]);

  return (
    <main className='h-screen overflow-hidden'>
      <Navbar
        imageInputRef={imageInputRef}
        activeElement={activeElement}
        handleImageUpload={(e: any) => {
          // prevent the default behavior of the input element
          e.stopPropagation();

          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            updateCanvasObject,
          });
        }}
        handleActiveElement={handleActiveElement}
      />

      <section className='flex h-full flex-row'>
        <Live canvasRef={canvasRef} undo={undo} redo={redo} />

        <RightSidebar
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          updateCanvasObject={updateCanvasObject}
        />
      </section>
    </main>
  );
};

export default Home;
