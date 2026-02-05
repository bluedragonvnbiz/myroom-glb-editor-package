import React from 'react';

interface GlbEditorProps {
    glbBlob: Blob;
    onMeshSelected?: (meshName: string) => void;
    className?: string;
    style?: React.CSSProperties;
}
declare const GlbEditor: React.FC<GlbEditorProps>;

export { GlbEditor, type GlbEditorProps };
