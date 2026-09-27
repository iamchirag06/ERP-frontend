import { api } from '@/lib/api';
import type { StudyMaterialResponse, ResourceUploadRequest } from '@/types/academic';

export const getResourcesBySubject = (subjectId: string) =>
  api
    .get<StudyMaterialResponse[]>(`/api/resources/subject/${subjectId}`)
    .then((r) => r.data);

export const uploadResource = (data: ResourceUploadRequest, file: File) => {
  const fd = new FormData();
  fd.append('file', file);   // ← file stays in the body

  return api
    .post<StudyMaterialResponse>('/api/resources/upload', fd, {
      // ← query params go in the URL
      params: {
        subjectId: data.subjectId,
        title: data.title,
        unitTag: data.unit ?? '',   // ← always send, even if empty
      },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const deleteResource = (id: string) =>
  api.delete(`/api/resources/${id}`).then((r) => r.data);