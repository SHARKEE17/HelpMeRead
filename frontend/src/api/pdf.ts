import axios from 'axios';

const api = axios.create({
    withCredentials: true,
});

export const pdfApi = {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/documents/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    getStatus: (id: string) => api.get(`/documents/${id}/`),
    getStatusOnly: (id: string) => api.get(`/documents/${id}/status/`),
    list: () => api.get('/documents/'),

    // Highlights
    getHighlights: (documentId: string) => api.get(`/highlights/?document=${documentId}`),
    createHighlight: (data: { document: string, block_id: string, start_offset: number, end_offset: number, color: string, text: string }) =>
        api.post('/highlights/', data),

    // AI
    explainText: (selectedText: string, surroundingContext: string) =>
        api.post('/explain/', { selectedText, surroundingContext }),
};
