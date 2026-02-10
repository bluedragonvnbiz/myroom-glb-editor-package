import React from 'react';

interface GlbEditorProps {
    glbBlob: Blob;
    imageURL?: string;
    onMeshSelected?: (meshName: string, faceId: number) => void;
    className?: string;
    style?: React.CSSProperties;
}
declare const GlbEditor: React.FC<GlbEditorProps>;

export { GlbEditor, type GlbEditorProps };
