import type { Node, Connection } from '@vue-flow/core';
import type { Node as AppNode, ComponentPath } from '~/types/builder.types';

export const useConnectionValidation = () => {

    /**
     * Check if a connection is valid based on types
     */
    const isValidConnection = (connection: Connection, nodes: AppNode[]) => {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        if (!sourceNode || !targetNode) return false;
        if (!sourceNode.data?.component || !targetNode.data?.component) return false;

        // Find the specific handles
        const outputDef = (sourceNode.data?.component?.output_path || []).find(
            (o: ComponentPath) => o.name === connection.sourceHandle
        );

        const inputDef = (targetNode.data?.component?.input_path || []).find(
            (i: ComponentPath) => i.name === connection.targetHandle
        );

        if (!outputDef || !inputDef) return false;

        // Type matching logic
        // 'Any' type accepts anything and can be connected to anything
        if (outputDef.type === 'Any' || inputDef.type === 'Any') return true;

        // Strict matching for other types
        return outputDef.type === inputDef.type;
    };

    /**
     * Highlight handles that are compatible with the source handle being dragged
     */
    const highlightCompatibleHandles = (
        params: { nodeId: string; handleId: string; handleType: 'source' | 'target' },
        nodes: AppNode[]
    ) => {
        const sourceNode = nodes.find(n => n.id === params.nodeId);
        if (!sourceNode?.data?.component) return;

        // Determine the type of the handle we are dragging
        let sourceType: string | null = null;

        if (params.handleType === 'source') {
            const h = (sourceNode.data?.component?.output_path || []).find((o: any) => o.name === params.handleId);
            if (h) sourceType = h.type;
        } else {
            // Dragging from input is less common but possible in some flows (reverse connect), 
            // usually we drag FROM source TO target.
            const h = (sourceNode.data?.component?.input_path || []).find((i: any) => i.name === params.handleId);
            if (h) sourceType = h.type;
        }

        if (!sourceType) return;

        // Iterate all nodes and mark compatible handles
        // We update the DOM directly via data attributes for performance during drag
        nodes.forEach(node => {
            if (!node.data?.component) return;

            // If dragging FROM source, we look for compatible INPUTS (targets)
            // If dragging FROM target (reverse), we look for compatible OUTPUTS (sources)

            const targetHandles = params.handleType === 'source'
                ? (node.data?.component?.input_path || [])
                : (node.data?.component?.output_path || []);

            targetHandles.forEach((handle: any) => {
                const isCompatible = sourceType === 'Any' || handle.type === 'Any' || sourceType === handle.type;

                // Select the specific handle element
                // ID structure: "nodeId-handleName" is standard, but check CanvasArea implementation
                // In CanvasArea, handle ID is just handle.name, but scoped to node via VueFlow context.
                // VueFlow adds class "vue-flow__handle" and logic.
                // We added :id="input.name".
                // We can target by [data-handleid] or rely on a custom attribute if we add one.
                // Let's rely on finding the element by a custom attribute we will add to Handle: data-handle-id

                // ... Actually, VueFlow manages this. Maybe we just toggle a class on the wrapper?

                const selector = `[data-nodeid="${node.id}"] [data-handleid="${handle.name}"]`;
                // Note: We need to ensure we add these data attributes in CanvasArea template!

                const el = document.querySelector(selector);
                if (el) {
                    el.setAttribute('data-compatible', isCompatible.toString());
                }
            });
        });
    };

    const clearCompatibilityMarkers = () => {
        document.querySelectorAll('[data-compatible]').forEach(el => {
            el.removeAttribute('data-compatible');
        });
    };

    return {
        isValidConnection,
        highlightCompatibleHandles,
        clearCompatibilityMarkers,
    };
};
