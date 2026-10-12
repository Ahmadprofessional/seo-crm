# Third-Party Open Source Libraries & Attribution

All third-party libraries and code techniques used in the YourHealthFirst SEO CRM adhere strictly to permissive open-source licenses (MIT / Apache-2.0 / ISC).

| Package / Repository | Author / Maintainer | License | Usage & Technique Adapted |
| :--- | :--- | :--- | :--- |
| **`three`** | Mr.doob & Three.js authors | MIT | WebGL 3D rendering engine. Used for instanced box meshes in the login skyline and dashboard volume visualizer. |
| **`@react-three/fiber`** | pmndrs | MIT | Declarative React wrapper for Three.js. Pointer-driven parallax, scene lifecycle, and canvas render loops. |
| **`@react-three/drei`** | pmndrs | MIT | Helper primitives (`OrbitControls`, `Text`, `useCursor`, instancing utilities). |
| **`motion` (Framer Motion)** | Motion Software / Matt Perry | MIT | Spring-physics layout animations, shared layout drawer morphing, and presence transitions. |
| **`gsap`** | GreenSock | Standard License | Timeline orchestration for entrance choreography and staggered editorial reveals. |
| **`lenis`** | Studio Freight / Darkroom Engineering | MIT | High-performance smooth scrolling for long dashboard and table layouts. |
| **`@dnd-kit/core`** & **`@dnd-kit/sortable`** | Claudéric Demers | MIT | Accessible drag-and-drop physics with customized lift rotation and settling transitions. |
| **`googleapis`** | Google LLC | Apache-2.0 | Official Google Sheets API v4 server-side integration. |
| **`papaparse`** | Matt Holt | MIT | Fast CSV parsing and export generation. |
| **`zod`** | Colin McDonnell | MIT | Strict schema validation for keyword data mutations and CSV imports. |
| **`lucide-react`** | Lucide Contributors | ISC | Minimal functional icon set (arrows, edit, close, logout) without decorative clutter. |

### Technique Attributions
- **Instanced Mesh Skyline**: Adapted from pmndrs Three.js instanced mesh examples using matrix transformation arrays and dummy object updates (`instancedMesh.setMatrixAt`).
- **Pointer-Driven Parallax**: Smooth spring interpolation of mouse coordinates to camera position inspired by Three.js interactive camera rigs.
