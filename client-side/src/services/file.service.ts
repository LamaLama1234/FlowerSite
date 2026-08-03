import { API_URL, getFilesUrl } from "@/constants/api.constants";
import { getAccessToken } from "./auth-token.service";

export interface IUploadedFile {
  url: string;
  name: string;
}

export const fileService = {
  // Намеренно не через axiosWithAuth: при FormData-теле axios должен сам
  // убрать Content-Type и дать браузеру проставить multipart-boundary, но
  // с этой версией axios под Turbopack это не срабатывает — тело уходит
  // как JSON, и бэкенд получает пустой список файлов. Нативный fetch с
  // FormData работает предсказуемо, поэтому загрузку файлов ведём через него.
  async upload(files: File[], folder: "products" | "avatars" = "products") {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const accessToken = getAccessToken();
    const response = await fetch(`${API_URL}${getFilesUrl(`?folder=${folder}`)}`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "Не удалось загрузить файл");
    }

    return response.json() as Promise<IUploadedFile[]>;
  },
};
