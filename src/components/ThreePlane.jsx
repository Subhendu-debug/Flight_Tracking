
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Float, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const LowPolyPlane = (props) => {
    const group = useRef();

    // Auto-rotate the plane
    useFrame((state, delta) => {
        if (group.current) {
            group.current.rotation.y += delta * 0.5;
            // Add slight wobble for realism
            group.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.1;
            group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        }
    });

    return (
        <group ref={group} {...props} dispose={null}>
            {/* Fuselage */}
            <mesh position={[0, 0, 0]}>
                <capsuleGeometry args={[0.8, 4.5, 4, 16]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Cockpit Window */}
            <mesh position={[0, 0.4, 1.8]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.7, 0.5, 1]} />
                <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* Wings */}
            <group position={[0, 0, 0.5]}>
                <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <boxGeometry args={[6, 1.5, 0.2]} />
                    {/* Wing shape created by scaling box usually, but simpler primitive is easier */}
                    <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.6} />
                </mesh>
            </group>

            {/* Tail */}
            <group position={[0, 0.5, -2]} rotation={[0.2, 0, 0]}>
                <mesh>
                    <boxGeometry args={[2, 0.8, 0.1]} />
                    <meshStandardMaterial color="#3b82f6" roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                    <boxGeometry args={[1, 1, 0.1]} />
                    <meshStandardMaterial color="#3b82f6" roughness={0.4} />
                </mesh>
            </group>

            {/* Engines */}
            <mesh position={[1.5, -0.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-1.5, -0.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
};

const ThreePlane = () => {
    return (
        <div className="w-full h-full relative">
            <Canvas>
                <PerspectiveCamera makeDefault position={[3, 2, 5]} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                {/* Environment */}
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <LowPolyPlane rotation={[0, -Math.PI / 4, 0]} />
                </Float>

                <Sparkles count={50} scale={5} size={2} speed={0.4} opacity={0.5} color="#38bdf8" />
                <ContactShadows resolution={512} scale={10} blur={2} opacity={0.5} far={10} color="#0f172a" />

                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default ThreePlane;
