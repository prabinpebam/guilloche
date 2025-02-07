# Guilloché Pattern Generator
Prabi Pebam

This project is a web-based interactive Guilloché Pattern Generator built using HTML, JavaScript, and Bootstrap. It creates intricate, mathematically derived patterns reminiscent of traditional Guilloché designs and offers a wide range of parameters for real-time customization and animation.


![Guilloche pattern examples](/images/Guilloche-pattern-examples.png "Guilloche pattern examples")
![Guilloche pattern generator UI](/images/Guilloche-pattern-generator.png "Guilloche pattern generator UI")



## How It Works

1. **Parametric Equations:**  
   The core of the generator is based on spirograph equations. Depending on the relationship between:
   - **Fixed Circle Radius (R)**
   - **Rolling Circle Radius (r)**
   - **Pen Distance (d)**
   
   the code computes points along a curve using:
   - **Epicycloid equations** (when *d* ≈ *r*)
   - **Hypotrochoid equations** (when *d* < *r*)
   - **Epitrochoid equations** (when *d* > *r*)

2. **Point Calculation:**  
   A function called `computePoint` calculates the (x, y) coordinates for each value of the parameter `t` (which covers several rotations). These points form the base Guilloché pattern.

3. **Polar Displacement:**  
   The generator applies a secondary modification by displacing each point in polar coordinates. This “displacement map” alters the radius as a function of the angle using user-controlled parameters (amplitude, frequency, phase, and exponent). This effect enables organic, symmetrical shapes like stars or flowers.

4. **Gradient Coloring:**  
   The line is drawn by connecting the computed points. Each segment is colored using a looping gradient that interpolates between up to four user-defined colors. The gradient can repeat multiple times along the length of the curve.

5. **Animation and Real-Time Interactivity:**  
   The UI provides controls for all parameters, including:
   - Core spirograph parameters
   - Secondary (polar displacement) modifiers
   - Animation toggle that continuously advances the displacement phase and oscillates the displacement amplitude
   - A color picker to change the canvas background in real time

6. **SVG Export:**  
   The project includes an export function that generates an SVG file of the current pattern, allowing for high-quality, scalable output.

## Technologies Used

- **HTML, CSS, and JavaScript:** For structure, styling, and dynamic behavior.
- **Bootstrap 5:** For responsive layout and styled UI components.
- **Canvas API:** For rendering the dynamic Guilloché patterns.

## Getting Started

Play with the generator here...
[Guilloche pattern generator](https://prabinpebam.github.io/guilloche/)


1. Clone or download the repository.
2. Open the `index.html` file in a modern web browser.
3. Use the interactive controls to customize the pattern, animation, and background color.
4. Click **Export SVG** to download a vector version of the generated pattern.

---

Feel free to experiment with different settings and parameters to create a wide variety of beautiful Guilloché patterns!
