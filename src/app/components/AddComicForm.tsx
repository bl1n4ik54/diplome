import { useState } from "react";
import axios from "axios";

export default function AddComicForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [genreNames, setGenreNames] = useState<string[]>([]);

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value && !genreNames.includes(value)) {
      setGenreNames([...genreNames, value]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post("/api/comics/add", {
        title,
        description,
        cover_url: coverUrl,
        authorName,
        genreNames,
      });
      console.log("Comic added:", response.data);
    } catch (error) {
      console.error("Error adding comic:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Название манги:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Описание:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Ссылка на обложку:
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Автор:
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Жанры:
          <input
            type="text"
            onChange={handleGenreChange}
            placeholder="Введите жанр"
          />
          <div>{genreNames.join(", ")}</div>
        </label>
      </div>
      <button type="submit">Добавить мангу</button>
    </form>
  );
}
