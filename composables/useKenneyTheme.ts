export const useKenneyTheme = () => {
    // Kenney-style aesthetic:
    // - Flat colors but distinct "layers"
    // - Thick, distinct borders (often not black, but darker shades of the main color)
    // - "Pushable" 3D feel via bottom border thickness or shadow
    // - Rounded corners (moderate)

    const panelStyle = {
        base: `
      border-width: 2px;
      border-style: solid;
      border-radius: 0.5rem;
      border-color: hsl(var(--border));
      background-color: hsl(var(--card));
      box-shadow: 0 4px 0 0 hsl(var(--muted-foreground) / 0.3);
      transition: all 0.1s ease-in-out;
    `,
        hover: `
      transform: translateY(-2px);
      box-shadow: 0 6px 0 0 hsl(var(--muted-foreground) / 0.3);
    `,
        active: `
      transform: translateY(2px);
      box-shadow: 0 0 0 0 hsl(var(--muted-foreground) / 0.3);
    `
    };

    const headerStyle = `
    border-bottom-width: 2px;
    border-bottom-style: solid;
    border-bottom-color: rgba(0,0,0,0.1);
    background-color: rgba(0,0,0,0.02);
    font-weight: 600;
  `;

    // Helper to generate dynamic Kenney-style borders based on category color
    const getPanelStyle = (categoryColor: string) => {
        // We assume categoryColor is an HSL string like 'hsl(173 58% 39%)'
        // For the border/shadow, we want a darker version. 
        // Since we're using raw CSS strings here and not SCSS, we might cheat slightly 
        // by using the color as the border and a generic dark shadow, 
        // OR we relies on the caller to provide a "darker" variable.

        // Simpler approach: Use the category color for the THICK border and shadow
        return {
            border: `2px solid ${categoryColor}`, // Standard border
            boxShadow: `0 4px 0 0 ${categoryColor}`, // "3D" bottom edge
            borderRadius: '0.75rem', // Slightly rounder for game feel
            marginBottom: '4px', // Space for the shadow
            transition: 'transform 0.1s, box-shadow 0.1s',
        };
    };

    return {
        panelStyle,
        headerStyle,
        getPanelStyle
    };
};
