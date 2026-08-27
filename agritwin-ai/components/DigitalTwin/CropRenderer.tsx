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

// --------------------------------------------------------
// 4. TOMATO
// Branching stems with green/red spherical fruits
// --------------------------------------------------------
export function TomatoRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const fruitRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const branchesPerPlant = 3;
  const fruitsPerPlant = 4;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (branchRef.current && fruitRef.current) {
      let bIdx = 0;
      let fIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const height = Math.max(0.1, growthFactor * 2.0) * off.scale;
        
        // Branches
        for (let b = 0; b < branchesPerPlant; b++) {
          const bAngle = off.ry + (Math.PI * 2 / branchesPerPlant) * b;
          const tilt = 0.3 + (growthFactor * 0.2); 
          dummy.position.set(pos.x + off.ox, pos.y, pos.z + off.oz);
          dummy.rotation.set(0, bAngle, tilt);
          dummy.translateY(height / 2);
          dummy.scale.set(0.02, height, 0.02);
          dummy.updateMatrix();
          branchRef.current!.setMatrixAt(bIdx++, dummy.matrix);
        }

        // Fruits (appear after flowering >0.5)
        if (growthFactor > 0.5) {
          for (let f = 0; f < fruitsPerPlant; f++) {
            const fAngle = off.ry + (Math.PI * 2 / fruitsPerPlant) * f + 0.5;
            const fHeight = height * (0.4 + (f * 0.1));
            dummy.position.set(pos.x + off.ox, pos.y, pos.z + off.oz);
            dummy.rotation.set(0, fAngle, 0.4);
            dummy.translateY(fHeight);
            
            const fSize = 0.03 + (growthFactor * 0.04);
            dummy.scale.set(fSize, fSize, fSize);
            dummy.updateMatrix();
            fruitRef.current!.setMatrixAt(fIdx++, dummy.matrix);
          }
        } else {
          for (let f = 0; f < fruitsPerPlant; f++) {
            dummy.scale.set(0,0,0);
            dummy.updateMatrix();
            fruitRef.current!.setMatrixAt(fIdx++, dummy.matrix);
          }
        }
      });
      branchRef.current.instanceMatrix.needsUpdate = true;
      fruitRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  const fruitColor = growthFactor > 0.8 ? new THREE.Color('#ef4444') : new THREE.Color('#84cc16');

  return (
    <group>
      <instancedMesh ref={branchRef} args={[undefined, undefined, totalPlants * branchesPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshStandardMaterial color={plantColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={fruitRef} args={[undefined, undefined, totalPlants * fruitsPerPlant]} castShadow>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={fruitColor} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 5. SUGARCANE
// Tall thick stalks with long narrow leaves
// --------------------------------------------------------
export function SugarcaneRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const stalkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const stalksPerPlant = 3;
  const leavesPerStalk = 4;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.9 + Math.random() * 0.2,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (stalkRef.current && leafRef.current) {
      let sIdx = 0;
      let lIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const height = Math.max(0.2, growthFactor * 4.0) * off.scale;
        
        for (let s = 0; s < stalksPerPlant; s++) {
          const sAngle = off.ry + (Math.PI * 2 / stalksPerPlant) * s;
          const tilt = 0.05 + (growthFactor * 0.05); 
          dummy.position.set(pos.x + off.ox, pos.y, pos.z + off.oz);
          dummy.rotation.set(0, sAngle, tilt);
          
          dummy.translateY(height / 2);
          const thickness = 0.03 + (growthFactor * 0.02);
          dummy.scale.set(thickness, height, thickness);
          dummy.updateMatrix();
          stalkRef.current!.setMatrixAt(sIdx++, dummy.matrix);

          // Leaves near top
          if (growthFactor > 0.2) {
            for (let l = 0; l < leavesPerStalk; l++) {
              const lY = height * (0.5 + (l / leavesPerStalk) * 0.4);
              const lAngle = sAngle + (l * Math.PI / 2);
              dummy.position.set(pos.x + off.ox, pos.y, pos.z + off.oz);
              dummy.rotation.set(0, sAngle, tilt);
              dummy.translateY(lY);
              dummy.rotateY(lAngle);
              dummy.rotateZ(-0.4); // tilt out
              
              const lLength = height * 0.4;
              dummy.scale.set(thickness * 2, lLength, 1);
              dummy.updateMatrix();
              leafRef.current!.setMatrixAt(lIdx++, dummy.matrix);
            }
          } else {
            for (let l = 0; l < leavesPerStalk; l++) {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              leafRef.current!.setMatrixAt(lIdx++, dummy.matrix);
            }
          }
        }
      });
      stalkRef.current.instanceMatrix.needsUpdate = true;
      leafRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  return (
    <group>
      <instancedMesh ref={stalkRef} args={[undefined, undefined, totalPlants * stalksPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6, 5]} />
        <meshStandardMaterial color={plantColor} roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[genericDroopLeaf, undefined, totalPlants * stalksPerPlant * leavesPerStalk]} castShadow>
        <meshStandardMaterial color={plantColor.clone().offsetHSL(0,0,-0.05)} roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 6. COTTON
// Branching structure with fluffy white bolls near harvest
// --------------------------------------------------------
export function CottonRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const bollRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const branchesPerPlant = 4;
  const bollsPerPlant = 5;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.15,
    oz: (Math.random() - 0.5) * 0.15,
  })), [positions]);

  useEffect(() => {
    if (branchRef.current && bollRef.current) {
      let bIdx = 0;
      let bollIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const height = Math.max(0.1, growthFactor * 1.8) * off.scale;
        
        for (let b = 0; b < branchesPerPlant; b++) {
          const bAngle = off.ry + (Math.PI * 2 / branchesPerPlant) * b;
          const tilt = 0.4;
          dummy.position.set(pos.x + off.ox, pos.y, pos.z + off.oz);
          dummy.rotation.set(0, bAngle, tilt);
          dummy.translateY(height / 2);
          dummy.scale.set(0.02, height, 0.02);
          dummy.updateMatrix();
          branchRef.current!.setMatrixAt(bIdx++, dummy.matrix);
        }

        if (growthFactor > 0.6) {
          for (let bl = 0; bl < bollsPerPlant; bl++) {
            const blAngle = off.ry + (Math.PI * 2 / bollsPerPlant) * bl + 0.3;
            const blHeight = height * (0.5 + (bl * 0.1));
            dummy.position.set(pos.x + off.ox, pos.y, pos.z + off.oz);
            dummy.rotation.set(0, blAngle, 0.4);
            dummy.translateY(blHeight);
            
            const blSize = 0.04 + (growthFactor * 0.03);
            dummy.scale.set(blSize, blSize, blSize);
            dummy.updateMatrix();
            bollRef.current!.setMatrixAt(bollIdx++, dummy.matrix);
          }
        } else {
          for (let bl = 0; bl < bollsPerPlant; bl++) {
            dummy.scale.set(0,0,0);
            dummy.updateMatrix();
            bollRef.current!.setMatrixAt(bollIdx++, dummy.matrix);
          }
        }
      });
      branchRef.current.instanceMatrix.needsUpdate = true;
      bollRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  return (
    <group>
      <instancedMesh ref={branchRef} args={[undefined, undefined, totalPlants * branchesPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshStandardMaterial color={plantColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={bollRef} args={[undefined, undefined, totalPlants * bollsPerPlant]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 7. GROUNDNUT
// Low bushy foliage, yellow flowers, and underground pods
// --------------------------------------------------------
export function GroundnutRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const podRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();

  const podsPerPlant = 4;
  const flowersPerPlant = 3;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (foliageRef.current && podRef.current && flowerRef.current) {
      let fIdx = 0, pIdx = 0, flIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const bushSize = Math.max(0.05, growthFactor * 0.4) * off.scale;
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        // Foliage (low flat sphere)
        dummy.position.set(cx, pos.y + bushSize / 2, cz);
        dummy.scale.set(bushSize * 1.5, bushSize, bushSize * 1.5);
        dummy.rotation.set(0, off.ry, 0);
        dummy.updateMatrix();
        foliageRef.current!.setMatrixAt(fIdx++, dummy.matrix);

        // Flowers (0.3 to 0.7)
        if (growthFactor > 0.3 && growthFactor < 0.8) {
          for (let fl = 0; fl < flowersPerPlant; fl++) {
            const angle = off.ry + (Math.PI * 2 / flowersPerPlant) * fl;
            const dist = bushSize * 0.8;
            dummy.position.set(cx + Math.cos(angle)*dist, pos.y + bushSize, cz + Math.sin(angle)*dist);
            dummy.scale.set(0.02, 0.02, 0.02);
            dummy.updateMatrix();
            flowerRef.current!.setMatrixAt(flIdx++, dummy.matrix);
          }
        } else {
          for (let fl = 0; fl < flowersPerPlant; fl++) {
            dummy.scale.set(0,0,0);
            dummy.updateMatrix();
            flowerRef.current!.setMatrixAt(flIdx++, dummy.matrix);
          }
        }

        // Pods (underground)
        if (growthFactor > 0.5) {
          for (let p = 0; p < podsPerPlant; p++) {
            const angle = off.ry + (Math.PI * 2 / podsPerPlant) * p;
            const pSize = 0.02 + (growthFactor * 0.02);
            dummy.position.set(cx + Math.cos(angle)*bushSize*0.5, pos.y - pSize, cz + Math.sin(angle)*bushSize*0.5);
            dummy.scale.set(pSize, pSize * 1.5, pSize);
            dummy.rotation.set(Math.random(), Math.random(), 0);
            dummy.updateMatrix();
            podRef.current!.setMatrixAt(pIdx++, dummy.matrix);
          }
        } else {
          for (let p = 0; p < podsPerPlant; p++) {
            dummy.scale.set(0,0,0);
            dummy.updateMatrix();
            podRef.current!.setMatrixAt(pIdx++, dummy.matrix);
          }
        }
      });
      foliageRef.current.instanceMatrix.needsUpdate = true;
      podRef.current.instanceMatrix.needsUpdate = true;
      flowerRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  return (
    <group>
      <instancedMesh ref={foliageRef} args={[undefined, undefined, totalPlants]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={plantColor} roughness={1.0} />
      </instancedMesh>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, totalPlants * flowersPerPlant]} castShadow>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color="#fef08a" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={podRef} args={[undefined, undefined, totalPlants * podsPerPlant]} castShadow>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#d4d4d8" roughness={1.0} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 8. ONION
// Vertical tubular leaves with an enlarging bulb at ground level
// --------------------------------------------------------
export function OnionRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const leavesPerPlant = 4;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.05,
    oz: (Math.random() - 0.5) * 0.05,
  })), [positions]);

  useEffect(() => {
    if (leafRef.current && bulbRef.current) {
      let lIdx = 0, bIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const height = Math.max(0.1, growthFactor * 0.6) * off.scale;
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        // Tubular leaves
        for (let l = 0; l < leavesPerPlant; l++) {
          const lAngle = off.ry + (Math.PI * 2 / leavesPerPlant) * l;
          dummy.position.set(cx, pos.y, cz);
          dummy.rotation.set(0, lAngle, 0.2); // slight spread
          dummy.translateY(height / 2);
          dummy.scale.set(0.015, height, 0.015);
          dummy.updateMatrix();
          leafRef.current!.setMatrixAt(lIdx++, dummy.matrix);
        }

        // Bulb
        if (growthFactor > 0.3) {
          const bulbSize = Math.max(0.01, growthFactor * 0.08);
          // Rests exactly on ground (pos.y + bulbSize)
          dummy.position.set(cx, pos.y + bulbSize*0.8, cz);
          dummy.scale.set(bulbSize, bulbSize * 0.8, bulbSize);
          dummy.rotation.set(0, off.ry, 0);
          dummy.updateMatrix();
          bulbRef.current!.setMatrixAt(bIdx++, dummy.matrix);
        } else {
          dummy.scale.set(0,0,0);
          dummy.updateMatrix();
          bulbRef.current!.setMatrixAt(bIdx++, dummy.matrix);
        }
      });
      leafRef.current.instanceMatrix.needsUpdate = true;
      bulbRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  const bulbColor = growthFactor > 0.8 ? new THREE.Color('#991b1b') : new THREE.Color('#fef08a');

  return (
    <group>
      <instancedMesh ref={leafRef} args={[undefined, undefined, totalPlants * leavesPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color={plantColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, totalPlants]} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={bulbColor} roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 9. POTATO
// Bushy top foliage with underground tubers
// --------------------------------------------------------
export function PotatoRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const tuberRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const tubersPerPlant = 4;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (foliageRef.current && tuberRef.current) {
      let fIdx = 0, tIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const bushSize = Math.max(0.1, growthFactor * 0.5) * off.scale;
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        // Foliage
        dummy.position.set(cx, pos.y + bushSize / 2, cz);
        dummy.scale.set(bushSize, bushSize * 0.7, bushSize);
        dummy.rotation.set(0, off.ry, 0);
        dummy.updateMatrix();
        foliageRef.current!.setMatrixAt(fIdx++, dummy.matrix);

        // Tubers
        if (growthFactor > 0.4) {
          for (let t = 0; t < tubersPerPlant; t++) {
            const angle = off.ry + (Math.PI * 2 / tubersPerPlant) * t;
            const tSize = 0.04 + (growthFactor * 0.04);
            dummy.position.set(
              cx + Math.cos(angle)*bushSize*0.4, 
              pos.y - tSize, 
              cz + Math.sin(angle)*bushSize*0.4
            );
            dummy.scale.set(tSize, tSize * 0.8, tSize);
            dummy.rotation.set(Math.random(), Math.random(), 0);
            dummy.updateMatrix();
            tuberRef.current!.setMatrixAt(tIdx++, dummy.matrix);
          }
        } else {
          for (let t = 0; t < tubersPerPlant; t++) {
            dummy.scale.set(0,0,0);
            dummy.updateMatrix();
            tuberRef.current!.setMatrixAt(tIdx++, dummy.matrix);
          }
        }
      });
      foliageRef.current.instanceMatrix.needsUpdate = true;
      tuberRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  return (
    <group>
      <instancedMesh ref={foliageRef} args={[undefined, undefined, totalPlants]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={plantColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={tuberRef} args={[undefined, undefined, totalPlants * tubersPerPlant]} castShadow>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#92400e" roughness={1.0} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 10. CHILLI
// Branching stem with thin cone fruits hanging down
// --------------------------------------------------------
export function ChilliRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const fruitRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const branchesPerPlant = 3;
  const fruitsPerPlant = 6;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (branchRef.current && fruitRef.current) {
      let bIdx = 0, fIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const height = Math.max(0.1, growthFactor * 1.5) * off.scale;
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        for (let b = 0; b < branchesPerPlant; b++) {
          const bAngle = off.ry + (Math.PI * 2 / branchesPerPlant) * b;
          dummy.position.set(cx, pos.y, cz);
          dummy.rotation.set(0, bAngle, 0.3);
          dummy.translateY(height / 2);
          dummy.scale.set(0.015, height, 0.015);
          dummy.updateMatrix();
          branchRef.current!.setMatrixAt(bIdx++, dummy.matrix);
        }

        if (growthFactor > 0.6) {
          for (let f = 0; f < fruitsPerPlant; f++) {
            const fAngle = off.ry + (Math.PI * 2 / fruitsPerPlant) * f;
            const fHeight = height * (0.5 + (f/fruitsPerPlant)*0.4);
            dummy.position.set(cx, pos.y, cz);
            dummy.rotation.set(0, fAngle, 0.3);
            dummy.translateY(fHeight);
            
            // Chillies point downwards
            dummy.rotateZ(Math.PI);
            
            const fSize = 0.015 + (growthFactor * 0.015);
            dummy.scale.set(fSize, fSize * 4, fSize);
            dummy.updateMatrix();
            fruitRef.current!.setMatrixAt(fIdx++, dummy.matrix);
          }
        } else {
          for (let f = 0; f < fruitsPerPlant; f++) {
            dummy.scale.set(0,0,0);
            dummy.updateMatrix();
            fruitRef.current!.setMatrixAt(fIdx++, dummy.matrix);
          }
        }
      });
      branchRef.current.instanceMatrix.needsUpdate = true;
      fruitRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  const chilliColor = growthFactor > 0.85 ? new THREE.Color('#ef4444') : new THREE.Color('#22c55e');

  return (
    <group>
      <instancedMesh ref={branchRef} args={[undefined, undefined, totalPlants * branchesPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color={plantColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={fruitRef} args={[undefined, undefined, totalPlants * fruitsPerPlant]} castShadow>
        <cylinderGeometry args={[0, 1, 1, 5]} />
        <meshStandardMaterial color={chilliColor} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 11. BANANA
// Giant central stalk with sweeping broad leaves, purple flower, and hanging bunch
// --------------------------------------------------------
export function BananaRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const stalkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const bunchRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const leavesPerPlant = 8;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.9 + Math.random() * 0.3,
    ox: (Math.random() - 0.5) * 0.2,
    oz: (Math.random() - 0.5) * 0.2,
  })), [positions]);

  useEffect(() => {
    if (stalkRef.current && leafRef.current && bunchRef.current && flowerRef.current) {
      let sIdx = 0, lIdx = 0, bIdx = 0, fIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const stalkHeight = Math.max(0.2, growthFactor * 4.5) * off.scale;
        const stalkThickness = 0.08 + (growthFactor * 0.12);
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        // Stalk
        dummy.position.set(cx, pos.y + stalkHeight / 2, cz);
        dummy.scale.set(stalkThickness, stalkHeight, stalkThickness);
        dummy.rotation.set(0, off.ry, 0);
        dummy.updateMatrix();
        stalkRef.current!.setMatrixAt(sIdx++, dummy.matrix);

        // Broad Leaves (Grow heavily from Day 31-180 -> 0.1 to 0.6)
        if (growthFactor > 0.05) {
          for (let l = 0; l < leavesPerPlant; l++) {
            const angle = off.ry + (Math.PI * 2 / leavesPerPlant) * l;
            const lY = stalkHeight * (0.5 + (l/leavesPerPlant)*0.4);
            dummy.position.set(cx, pos.y, cz);
            dummy.rotation.set(0, angle, 0);
            dummy.translateY(lY);
            dummy.rotateX(0.6); // arc out
            
            const lLen = stalkHeight * 0.65;
            const lWid = stalkThickness * 2.8;
            dummy.scale.set(lWid, lLen, 1);
            dummy.updateMatrix();
            leafRef.current!.setMatrixAt(lIdx++, dummy.matrix);
          }
        } else {
          for (let l = 0; l < leavesPerPlant; l++) {
            dummy.scale.set(0,0,0);
            dummy.updateMatrix();
            leafRef.current!.setMatrixAt(lIdx++, dummy.matrix);
          }
        }

        // Flower Inflorescence (Day 221-245 -> approx 0.73 to 0.81)
        if (growthFactor > 0.7) {
          dummy.position.set(cx, pos.y, cz);
          dummy.rotation.set(0, off.ry, 0);
          dummy.translateY(stalkHeight * 0.85); // hangs from near top
          dummy.rotateZ(3.14); // pointing down
          // If fruit is developing (>0.8), flower hangs even lower
          const fOffset = growthFactor > 0.8 ? 0.4 : 0.2; 
          dummy.translateY(stalkHeight * fOffset);
          
          const flSize = 0.08 + (growthFactor * 0.05);
          dummy.scale.set(flSize, flSize * 1.5, flSize);
          dummy.updateMatrix();
          flowerRef.current!.setMatrixAt(fIdx++, dummy.matrix);
        } else {
          dummy.scale.set(0,0,0);
          dummy.updateMatrix();
          flowerRef.current!.setMatrixAt(fIdx++, dummy.matrix);
        }

        // Banana Bunch (Day 246+ -> approx 0.81+)
        if (growthFactor > 0.8) {
          dummy.position.set(cx, pos.y, cz);
          dummy.rotation.set(0, off.ry, 0);
          dummy.translateY(stalkHeight * 0.85);
          dummy.rotateZ(3.14); // hanging down
          dummy.translateY(stalkHeight * 0.15); // bunch forms above the flower
          
          const bunchSize = 0.15 + ((growthFactor - 0.8) * 1.5); // scales up quickly
          dummy.scale.set(bunchSize * 0.6, bunchSize, bunchSize * 0.6);
          dummy.updateMatrix();
          bunchRef.current!.setMatrixAt(bIdx++, dummy.matrix);
        } else {
          dummy.scale.set(0,0,0);
          dummy.updateMatrix();
          bunchRef.current!.setMatrixAt(bIdx++, dummy.matrix);
        }
      });
      stalkRef.current.instanceMatrix.needsUpdate = true;
      leafRef.current.instanceMatrix.needsUpdate = true;
      flowerRef.current.instanceMatrix.needsUpdate = true;
      bunchRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  const fruitColor = growthFactor > 0.95 ? new THREE.Color('#facc15') : new THREE.Color('#4ade80');

  return (
    <group>
      <instancedMesh ref={stalkRef} args={[undefined, undefined, totalPlants]} castShadow>
        <cylinderGeometry args={[0.5, 1, 1, 8]} />
        <meshStandardMaterial color={plantColor.clone().offsetHSL(0,0.1,-0.1)} roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[genericCurvedLeaf, undefined, totalPlants * leavesPerPlant]} castShadow>
        <meshStandardMaterial color={plantColor.clone().offsetHSL(0,0,-0.05)} roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, totalPlants]} castShadow>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#701a75" roughness={0.8} /> {/* Purple-red */}
      </instancedMesh>
      <instancedMesh ref={bunchRef} args={[undefined, undefined, totalPlants]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6, 4]} />
        <meshStandardMaterial color={fruitColor} roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 12. MANGO
// Tree with trunk, dense rounded canopy, flowers, and fruits
// --------------------------------------------------------
export function MangoRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const fruitRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const flowersPerTree = 10;
  const fruitsPerTree = 8;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.3,
    oz: (Math.random() - 0.5) * 0.3,
  })), [positions]);

  useEffect(() => {
    if (trunkRef.current && canopyRef.current && flowerRef.current && fruitRef.current) {
      let tIdx = 0, cIdx = 0, flIdx = 0, frIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const height = Math.max(0.2, growthFactor * 3.5) * off.scale;
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        // Trunk
        const trunkThickness = 0.05 + (growthFactor * 0.15);
        dummy.position.set(cx, pos.y + height / 2, cz);
        dummy.scale.set(trunkThickness, height, trunkThickness);
        dummy.rotation.set(0, off.ry, 0);
        dummy.updateMatrix();
        trunkRef.current!.setMatrixAt(tIdx++, dummy.matrix);

        // Canopy (starts forming > 0.1)
        if (growthFactor > 0.1) {
          const canopySize = (0.2 + (growthFactor * 2.0)) * off.scale;
          dummy.position.set(cx, pos.y + height * 0.8, cz); // Canopy sits near top
          dummy.scale.set(canopySize, canopySize * 0.8, canopySize);
          dummy.rotation.set(Math.random(), off.ry, Math.random());
          dummy.updateMatrix();
          canopyRef.current!.setMatrixAt(cIdx++, dummy.matrix);
          
          // Flowers (Day 241-270 -> approx 0.66 to 0.74)
          if (growthFactor > 0.65 && growthFactor < 0.8) {
            for (let fl = 0; fl < flowersPerTree; fl++) {
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.random() * Math.PI;
              const rad = canopySize * 0.9; // Outer edge of canopy
              dummy.position.set(
                cx + rad * Math.sin(phi) * Math.cos(theta),
                pos.y + height * 0.8 + rad * Math.cos(phi),
                cz + rad * Math.sin(phi) * Math.sin(theta)
              );
              dummy.scale.set(0.05, 0.05, 0.05);
              dummy.updateMatrix();
              flowerRef.current!.setMatrixAt(flIdx++, dummy.matrix);
            }
          } else {
            for (let fl = 0; fl < flowersPerTree; fl++) {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              flowerRef.current!.setMatrixAt(flIdx++, dummy.matrix);
            }
          }

          // Fruits (Day 271+ -> approx 0.74+)
          if (growthFactor > 0.7) {
            for (let fr = 0; fr < fruitsPerTree; fr++) {
              // Deterministic but scattered positions for fruits
              const theta = (Math.PI * 2 / fruitsPerTree) * fr + off.ry;
              const phi = Math.PI / 2 + (Math.sin(fr) * 0.5); // hangs in lower/mid canopy
              const rad = canopySize * 0.7; 
              dummy.position.set(
                cx + rad * Math.sin(phi) * Math.cos(theta),
                pos.y + height * 0.8 + rad * Math.cos(phi) - 0.1, // hangs slightly down
                cz + rad * Math.sin(phi) * Math.sin(theta)
              );
              
              const fruitSize = 0.03 + ((growthFactor - 0.7) * 0.2); // grows larger
              dummy.scale.set(fruitSize, fruitSize * 1.3, fruitSize); // oblong mango shape
              dummy.rotation.set(0, theta, 0.2); // hangs at slight angle
              dummy.updateMatrix();
              fruitRef.current!.setMatrixAt(frIdx++, dummy.matrix);
            }
          } else {
            for (let fr = 0; fr < fruitsPerTree; fr++) {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              fruitRef.current!.setMatrixAt(frIdx++, dummy.matrix);
            }
          }

        } else {
          dummy.scale.set(0,0,0);
          dummy.updateMatrix();
          canopyRef.current!.setMatrixAt(cIdx++, dummy.matrix);
          for (let fl = 0; fl < flowersPerTree; fl++) {
            flowerRef.current!.setMatrixAt(flIdx++, dummy.matrix);
          }
          for (let fr = 0; fr < fruitsPerTree; fr++) {
            fruitRef.current!.setMatrixAt(frIdx++, dummy.matrix);
          }
        }
      });
      trunkRef.current.instanceMatrix.needsUpdate = true;
      canopyRef.current.instanceMatrix.needsUpdate = true;
      flowerRef.current.instanceMatrix.needsUpdate = true;
      fruitRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  const mangoColor = growthFactor > 0.95 ? new THREE.Color('#fbbf24') : new THREE.Color('#65a30d'); // green to yellow-orange

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, totalPlants]} castShadow>
        <cylinderGeometry args={[0.5, 0.8, 1, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} /> {/* Brown trunk */}
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, totalPlants]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={plantColor} roughness={1.0} />
      </instancedMesh>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, totalPlants * flowersPerTree]} castShadow>
        <sphereGeometry args={[1, 4, 4]} />
        <meshStandardMaterial color="#fef08a" roughness={0.8} /> {/* Pale yellow flowers */}
      </instancedMesh>
      <instancedMesh ref={fruitRef} args={[undefined, undefined, totalPlants * fruitsPerTree]} castShadow>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={mangoColor} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// 12. CARROT
// Feathery green foliage above ground and a tapering orange cone below ground
// --------------------------------------------------------
export function CarrotRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const rootRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const leavesPerPlant = 5;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.05,
    oz: (Math.random() - 0.5) * 0.05,
  })), [positions]);

  useEffect(() => {
    if (foliageRef.current && rootRef.current) {
      let leafIdx = 0;
      let rootIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        // Root (below ground)
        const rootLength = Math.max(0.1, growthFactor * 0.4) * off.scale;
        const rootThickness = 0.02 + (growthFactor * 0.05);

        dummy.position.set(cx, pos.y - rootLength / 2, cz);
        dummy.scale.set(rootThickness, rootLength, rootThickness);
        // Carrot points down
        dummy.rotation.set(Math.PI, off.ry, 0); 
        dummy.updateMatrix();
        rootRef.current!.setMatrixAt(rootIdx++, dummy.matrix);

        // Leaves (above ground)
        if (growthFactor > 0.1) {
          const leafHeight = Math.max(0.1, growthFactor * 0.3) * off.scale;
          for (let l = 0; l < leavesPerPlant; l++) {
            const angle = off.ry + (Math.PI * 2 / leavesPerPlant) * l;
            dummy.position.set(cx, pos.y + leafHeight / 2, cz);
            dummy.rotation.set(0.3, angle, 0);
            dummy.scale.set(0.01, leafHeight, 0.01);
            dummy.updateMatrix();
            foliageRef.current!.setMatrixAt(leafIdx++, dummy.matrix);
          }
        } else {
          for (let l = 0; l < leavesPerPlant; l++) {
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            foliageRef.current!.setMatrixAt(leafIdx++, dummy.matrix);
          }
        }
      });
      foliageRef.current.instanceMatrix.needsUpdate = true;
      rootRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  return (
    <group>
      <instancedMesh ref={foliageRef} args={[undefined, undefined, totalPlants * leavesPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color={plantColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={rootRef} args={[undefined, undefined, totalPlants]} castShadow>
        <coneGeometry args={[1, 1, 16]} />
        <meshStandardMaterial color="#f97316" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// WHEAT
// --------------------------------------------------------
export function WheatRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const stalkRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const stalksPerPlant = 4;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (stalkRef.current && headRef.current) {
      let sIdx = 0, hIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const height = Math.max(0.1, growthFactor * 1.2) * off.scale;
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        for (let s = 0; s < stalksPerPlant; s++) {
          const sAngle = off.ry + (Math.PI * 2 / stalksPerPlant) * s;
          dummy.position.set(cx, pos.y, cz);
          dummy.rotation.set(0, sAngle, 0.15); // Slight spread
          dummy.translateY(height / 2);
          dummy.scale.set(0.015, height, 0.015);
          dummy.updateMatrix();
          stalkRef.current!.setMatrixAt(sIdx++, dummy.matrix);

          if (growthFactor > 0.5) {
            dummy.position.set(cx, pos.y, cz);
            dummy.rotation.set(0, sAngle, 0.15);
            dummy.translateY(height); // Top of stalk
            
            const headSize = 0.02 + (growthFactor * 0.04);
            dummy.scale.set(headSize * 0.5, headSize * 2, headSize * 0.5);
            dummy.updateMatrix();
            headRef.current!.setMatrixAt(hIdx++, dummy.matrix);
          } else {
            dummy.scale.set(0,0,0);
            dummy.updateMatrix();
            headRef.current!.setMatrixAt(hIdx++, dummy.matrix);
          }
        }
      });
      stalkRef.current.instanceMatrix.needsUpdate = true;
      headRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  const displayColor = growthFactor > 0.8 ? new THREE.Color('#d4af37') : plantColor;

  return (
    <group>
      <instancedMesh ref={stalkRef} args={[undefined, undefined, totalPlants * stalksPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color={displayColor} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, totalPlants * stalksPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 6, 4]} />
        <meshStandardMaterial color={displayColor} roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// JASMINE
// Shrub/Bush with dense small leaves, buds, and white flowers
// --------------------------------------------------------
export function JasmineRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const budRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  const branchesPerPlant = 5;
  const leavesPerBranch = 6;
  const flowersPerBranch = 3;

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (branchRef.current && leafRef.current && budRef.current && flowerRef.current) {
      let bIdx = 0, lIdx = 0, bdIdx = 0, fIdx = 0;
      
      positions.forEach((pos, i) => {
        const off = offsets[i];
        // Shrub height and width expand together
        const height = Math.max(0.1, growthFactor * 1.5) * off.scale;
        const cx = pos.x + off.ox;
        const cz = pos.z + off.oz;
        
        for (let b = 0; b < branchesPerPlant; b++) {
          const bAngle = off.ry + (Math.PI * 2 / branchesPerPlant) * b;
          const tilt = 0.3 + (growthFactor * 0.2); 
          dummy.position.set(cx, pos.y, cz);
          dummy.rotation.set(0, bAngle, tilt);
          dummy.translateY(height / 2);
          
          const branchThickness = 0.015 + (growthFactor * 0.01);
          dummy.scale.set(branchThickness, height, branchThickness);
          dummy.updateMatrix();
          branchRef.current!.setMatrixAt(bIdx++, dummy.matrix);

          // Leaves
          if (growthFactor > 0.1) {
            for (let l = 0; l < leavesPerBranch; l++) {
              const lAngle = bAngle + (l * Math.PI / 2);
              const lY = height * (0.2 + (l / leavesPerBranch) * 0.8);
              dummy.position.set(cx, pos.y, cz);
              dummy.rotation.set(0, bAngle, tilt);
              dummy.translateY(lY);
              dummy.rotateY(lAngle);
              dummy.rotateX(0.5);
              
              const lSize = 0.03 + (growthFactor * 0.03);
              // Scale to make an oval leaf shape
              dummy.scale.set(lSize, lSize * 1.5, lSize * 0.2);
              dummy.updateMatrix();
              leafRef.current!.setMatrixAt(lIdx++, dummy.matrix);
            }
          } else {
            for (let l = 0; l < leavesPerBranch; l++) {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              leafRef.current!.setMatrixAt(lIdx++, dummy.matrix);
            }
          }

          // Buds (appear between 0.5 and 0.8)
          if (growthFactor > 0.5 && growthFactor < 0.8) {
            for (let f = 0; f < flowersPerBranch; f++) {
              const fAngle = bAngle + (f * Math.PI / flowersPerBranch);
              const fY = height * 0.9; // Buds near tips
              dummy.position.set(cx, pos.y, cz);
              dummy.rotation.set(0, bAngle, tilt);
              dummy.translateY(fY);
              dummy.rotateY(fAngle);
              dummy.translateZ(0.05);
              
              const budSize = 0.015;
              dummy.scale.set(budSize, budSize * 1.2, budSize);
              dummy.updateMatrix();
              budRef.current!.setMatrixAt(bdIdx++, dummy.matrix);
            }
          } else {
            for (let f = 0; f < flowersPerBranch; f++) {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              budRef.current!.setMatrixAt(bdIdx++, dummy.matrix);
            }
          }

          // Flowers (appear > 0.7)
          if (growthFactor > 0.7) {
            for (let f = 0; f < flowersPerBranch; f++) {
              const fAngle = bAngle + (f * Math.PI / flowersPerBranch);
              const fY = height * (0.8 + (f * 0.05)); // Flowers near tips
              dummy.position.set(cx, pos.y, cz);
              dummy.rotation.set(0, bAngle, tilt);
              dummy.translateY(fY);
              dummy.rotateY(fAngle);
              dummy.translateZ(0.05);
              
              const fSize = 0.02 + ((growthFactor - 0.7) * 0.05);
              dummy.scale.set(fSize, fSize, fSize);
              dummy.updateMatrix();
              flowerRef.current!.setMatrixAt(fIdx++, dummy.matrix);
            }
          } else {
            for (let f = 0; f < flowersPerBranch; f++) {
              dummy.scale.set(0,0,0);
              dummy.updateMatrix();
              flowerRef.current!.setMatrixAt(fIdx++, dummy.matrix);
            }
          }
        }
      });
      branchRef.current.instanceMatrix.needsUpdate = true;
      leafRef.current.instanceMatrix.needsUpdate = true;
      budRef.current.instanceMatrix.needsUpdate = true;
      flowerRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  return (
    <group>
      <instancedMesh ref={branchRef} args={[undefined, undefined, totalPlants * branchesPerPlant]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color={plantColor.clone().offsetHSL(0, 0, -0.2)} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, totalPlants * branchesPerPlant * leavesPerBranch]} castShadow>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={plantColor} roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={budRef} args={[undefined, undefined, totalPlants * branchesPerPlant * flowersPerBranch]} castShadow>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial color="#bef264" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={flowerRef} args={[undefined, undefined, totalPlants * branchesPerPlant * flowersPerBranch]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// --------------------------------------------------------
// GENERIC FALLBACK
// --------------------------------------------------------
export function GenericCropRenderer({ growthFactor, plantColor, totalPlants, positions }: SpecificRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();

  const offsets = useMemo(() => positions.map(() => ({
    ry: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.4,
    ox: (Math.random() - 0.5) * 0.1,
    oz: (Math.random() - 0.5) * 0.1,
  })), [positions]);

  useEffect(() => {
    if (meshRef.current) {
      positions.forEach((pos, i) => {
        const off = offsets[i];
        const height = Math.max(0.1, growthFactor * 1.0) * off.scale;
        const thickness = 0.05 + (growthFactor * 0.1);
        
        dummy.position.set(pos.x + off.ox, pos.y + height / 2, pos.z + off.oz);
        dummy.scale.set(thickness, height, thickness);
        dummy.rotation.set(0, off.ry, 0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [growthFactor, totalPlants, positions]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalPlants]} castShadow>
      <cylinderGeometry args={[0.5, 1, 1, 8]} />
      <meshStandardMaterial color={plantColor} roughness={0.8} />
    </instancedMesh>
  );
}

// --------------------------------------------------------
// MAIN ROUTER COMPONENT
// Strict grid generation and routing to crop renderers
// --------------------------------------------------------
export function Crop3DRenderer(props: Crop3DRendererProps) {
  const { cropName, farmSize, growthPercentage } = props;
  
  const growthFactor = Math.min(1.0, Math.max(0.0, growthPercentage / 100));
  const config = getCropConfig(cropName);
  const name = config.id;
  
  const rowSpacing = config.spacing.row;
  const plantSpacing = config.spacing.plant;

  // Generate grid positions exactly
  const positions = useMemo(() => {
    const posArray: {x: number, y: number, z: number}[] = [];
    const numRows = Math.max(1, Math.floor(farmSize / rowSpacing));
    const plantsPerRow = Math.max(1, Math.floor(farmSize / plantSpacing));
    
    // Center the entire grid over the terrain
    const startX = -(plantsPerRow * plantSpacing) / 2 + (plantSpacing / 2);
    const startZ = -(numRows * rowSpacing) / 2 + (rowSpacing / 2);

    for (let r = 0; r < numRows; r++) {
      for (let p = 0; p < plantsPerRow; p++) {
        posArray.push({
          x: startX + (p * plantSpacing),
          y: 0,
          z: startZ + (r * rowSpacing)
        });
      }
    }
    return posArray;
  }, [farmSize, rowSpacing, plantSpacing]);

  const totalPlants = positions.length;
  const commonProps: SpecificRendererProps = { ...props, totalPlants, positions, growthFactor };

  // Route to the correct procedural generator
  if (name === 'paddy') return <PaddyRenderer {...commonProps} />;
  if (name === 'jasmine') return <JasmineRenderer {...commonProps} />;
  if (name === 'banana') return <BananaRenderer {...commonProps} />;
  if (name === 'mango') return <MangoRenderer {...commonProps} />;
  if (name === 'maize') return <MaizeRenderer {...commonProps} />;
  if (name === 'tomato') return <TomatoRenderer {...commonProps} />;
  if (name === 'cotton') return <CottonRenderer {...commonProps} />;
  if (name === 'sugarcane') return <SugarcaneRenderer {...commonProps} />;
  if (name === 'groundnut') return <GroundnutRenderer {...commonProps} />;
  if (name === 'onion') return <OnionRenderer {...commonProps} />;
  if (name === 'potato') return <PotatoRenderer {...commonProps} />;
  if (name === 'chilli') return <ChilliRenderer {...commonProps} />;
  if (name === 'carrot') return <CarrotRenderer {...commonProps} />;
  if (name === 'wheat') return <WheatRenderer {...commonProps} />;
  
  return <GenericCropRenderer {...commonProps} />;
}
