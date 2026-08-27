import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCropConfig } from './cropConfigs';

export interface Crop3DRendererProps {
  cropName: string;
  growthPercentage: number;
  cropAge?: number;
  growthStage: string;
  plantColor: THREE.Color;
  farmSize: number;
}

interface SpecificRendererProps extends Crop3DRendererProps {
  totalPlants: number;
  positions: { x: number; y: number; z: number }[];
  growthFactor: number;
}

// --------------------------------------------------------
// HIGH-FIDELITY PROCEDURAL GEOMETRIES
// --------------------------------------------------------
const genericCurvedLeaf = (() => {
  const geo = new THREE.PlaneGeometry(1, 1, 1, 6);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const ny = y + 0.5; // 0 to 1
    pos.setZ(i, -Math.pow(ny, 1.5) * 0.3); // curve backwards
    const taper = Math.max(0, 1 - Math.pow(ny, 1.5));
    pos.setX(i, pos.getX(i) * taper);
  }
  geo.computeVertexNormals();
  geo.translate(0, 0.5, 0); // pivot at base
  return geo;
})();

const genericDroopLeaf = (() => {
  const geo = new THREE.PlaneGeometry(1, 1, 1, 8);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const ny = y + 0.5;
    pos.setZ(i, -Math.pow(ny, 2.5) * 0.7); // dramatic droop
    const taper = Math.max(0, 1 - Math.pow(ny, 1.2));
    pos.setX(i, pos.getX(i) * taper);
  }
  geo.computeVertexNormals();
  geo.translate(0, 0.5, 0);
  return geo;
})();

// --------------------------------------------------------
// 1. PADDY (RICE)
// Thin multiple outward-curving grass blades originating from a central root cluster
// --------------------------------------------------------
export function PaddyRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const tillerRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const panicleRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();

  const tillersPerPlant = 6;
  const leavesPerTiller = 3;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.85 + Math.random() * 0.3,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (tillerRef.current && leafRef.current) {
      let tillerIdx = 0;
      let leafIdx = 0;
      let panicleIdx = 0;

      positions.forEach((pos, i) => {
        const off = offsets[i];
        const plantHeight = Math.max(0.1, growthFactor * 1.5) * off.scale;
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;

        for (let t = 0; t < tillersPerPlant; t++) {
          const tAngle = off.ry + (Math.PI * 2 / tillersPerPlant) * t;
          const tilt = 0.1 + (growthFactor * 0.2); // spread outward
          
          dummy.position.set(cx, pos.y, cz);
          dummy.rotation.set(0, tAngle, tilt);
          
          // Tiller (Stem)
          const tThick = 0.01 + (growthFactor * 0.01);
          dummy.scale.set(tThick, plantHeight, tThick);
          // Pivot is at bottom for cylinder if translated, but default is center
          dummy.translateY(plantHeight / 2);
          dummy.updateMatrix();
          tillerRef.current!.setMatrixAt(tillerIdx++, dummy.matrix);

          // Leaves
          if (growthFactor > 0.1) {
            for (let l = 0; l < leavesPerTiller; l++) {
              const lRatio = (l + 1) / (leavesPerTiller + 1);
              const leafY = plantHeight * lRatio;
              dummy.position.set(cx, pos.y, cz);
              dummy.rotation.set(0, tAngle, tilt);
              dummy.translateY(leafY);
              
              // angle leaf outwards from tiller
              dummy.rotateZ(-0.4); 
              dummy.rotateY(l * Math.PI); // alternate sides
              
              const lLen = plantHeight * 0.6;
              const lWid = tThick * 4;
              dummy.scale.set(lWid, lLen, 1);
              dummy.updateMatrix();
              leafRef.current!.setMatrixAt(leafIdx++, dummy.matrix);
            }
          } else {
            for (let l = 0; l < leavesPerTiller; l++) {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              leafRef.current!.setMatrixAt(leafIdx++, dummy.matrix);
            }
          }

          // Panicles (Rice grains)
          if (panicleRef.current) {
            if (growthFactor > 0.7) {
              dummy.position.set(cx, pos.y, cz);
              dummy.rotation.set(0, tAngle, tilt);
              dummy.translateY(plantHeight * 0.95);
              // Droop heavily
              dummy.rotateZ(1.5);
              
              const pSize = 0.03 + (growthFactor * 0.02);
              dummy.scale.set(pSize, pSize * 4, pSize);
              dummy.updateMatrix();
              panicleRef.current.setMatrixAt(panicleIdx++, dummy.matrix);
            } else {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              panicleRef.current.setMatrixAt(panicleIdx++, dummy.matrix);
            }
          }
        }
      });
      tillerRef.current.instanceMatrix.needsUpdate = true;
      leafRef.current.instanceMatrix.needsUpdate = true;
      if (panicleRef.current) panicleRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  const displayColor = growthFactor > 0.85 ? new THREE.Color('#d4af37') : plantColor;
  const panicleColor = growthFactor > 0.9 ? new THREE.Color('#eab308') : new THREE.Color('#84cc16');

  return (
    <group>
      <instancedMesh ref={tillerRef} args={[undefined, undefined, totalPlants * tillersPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color={displayColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[genericDroopLeaf, undefined, totalPlants * tillersPerPlant * leavesPerTiller]} castShadow>
        <meshStandardMaterial color={displayColor.clone().offsetHSL(0,0,-0.05)} roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={panicleRef} args={[undefined, undefined, totalPlants * tillersPerPlant]} castShadow>
        <cylinderGeometry args={[0.5, 1, 1, 5]} />
        <meshStandardMaterial color={panicleColor} roughness={1.0} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 2. MAIZE (CORN)
// Tapering central stalk with thin, long curving leaf geometries protruding at varying heights
// --------------------------------------------------------
export function MaizeRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const stalkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const cobRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const leavesPerPlant = 8;
  const cobsPerPlant = 2;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    tiltX: (Math.random() - 0.5) * 0.1,
    tiltZ: (Math.random() - 0.5) * 0.1,
    scale: 0.85 + Math.random() * 0.3,
    ox: (Math.random() - 0.5) * 0.15,
    oz: (Math.random() - 0.5) * 0.15,
  })), [positions]);

  useEffect(() => {
    if (stalkRef.current && leafRef.current) {
      let stalkIdx = 0;
      let leafIdx = 0;
      let cobIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const stalkHeight = Math.max(0.2, growthFactor * 3.5) * off.scale;
        const stalkThickness = 0.04 + (growthFactor * 0.05);
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        // Stalk (with taper)
        dummy.position.set(cx, pos.y + stalkHeight / 2, cz);
        dummy.scale.set(stalkThickness, stalkHeight, stalkThickness);
        dummy.rotation.set(off.tiltX, off.ry, off.tiltZ);
        dummy.updateMatrix();
        stalkRef.current!.setMatrixAt(stalkIdx++, dummy.matrix);

        // Leaves
        if (growthFactor > 0.05) {
          for (let l = 0; l < leavesPerPlant; l++) {
            const lRatio = (l + 1) / (leavesPerPlant + 1);
            const leafY = stalkHeight * lRatio;
            
            // Leaves emerge from nodes on opposite sides
            const angle = off.ry + (l * Math.PI) + (Math.random() * 0.2); 
            
            dummy.position.set(cx, pos.y, cz);
            dummy.rotation.set(off.tiltX, 0, off.tiltZ); // match stalk
            dummy.translateY(leafY); // move up stalk
            
            dummy.rotateY(angle); // spin around stalk
            dummy.rotateX(0.5 + (1 - lRatio) * 0.5); // droop down
            
            const leafLength = stalkHeight * 0.35;
            const leafWidth = stalkThickness * 3;
            
            dummy.scale.set(leafWidth, leafLength, 1);
            dummy.updateMatrix();
            leafRef.current!.setMatrixAt(leafIdx++, dummy.matrix);
          }
        } else {
          for (let l = 0; l < leavesPerPlant; l++) {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            leafRef.current!.setMatrixAt(leafIdx++, dummy.matrix);
          }
        }

        // Cobs
        if (cobRef.current) {
          if (growthFactor > 0.6) {
            for (let c = 0; c < cobsPerPlant; c++) {
              const cobY = stalkHeight * (0.4 + c * 0.15);
              const angle = off.ry + (c * Math.PI) + Math.PI/2;
              
              dummy.position.set(cx, pos.y, cz);
              dummy.rotation.set(off.tiltX, 0, off.tiltZ);
              dummy.translateY(cobY);
              dummy.rotateY(angle);
              
              // Cob tilts outward from stalk
              dummy.rotateX(0.4); 
              dummy.translateZ(stalkThickness);
              
              const cobLength = stalkHeight * 0.12;
              const cobThickness = stalkThickness * 1.5;
              dummy.scale.set(cobThickness, cobLength, cobThickness);
              dummy.updateMatrix();
              cobRef.current.setMatrixAt(cobIdx++, dummy.matrix);
            }
          } else {
            for (let c = 0; c < cobsPerPlant; c++) {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              cobRef.current.setMatrixAt(cobIdx++, dummy.matrix);
            }
          }
        }
      });
      stalkRef.current.instanceMatrix.needsUpdate = true;
      leafRef.current.instanceMatrix.needsUpdate = true;
      if (cobRef.current) cobRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  const cobColor = growthFactor > 0.9 ? new THREE.Color('#fef08a') : plantColor;

  return (
    <group>
      <instancedMesh ref={stalkRef} args={[undefined, undefined, totalPlants]} castShadow>
        <cylinderGeometry args={[0.5, 1, 1, 6]} />
        <meshStandardMaterial color={plantColor} roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[genericCurvedLeaf, undefined, totalPlants * leavesPerPlant]} castShadow>
        <meshStandardMaterial color={plantColor.clone().offsetHSL(0, 0, -0.05)} roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={cobRef} args={[undefined, undefined, totalPlants * cobsPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color={cobColor} roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

