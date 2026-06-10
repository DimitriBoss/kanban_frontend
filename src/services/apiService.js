import api from "./api";

const getVersion = () => localStorage.getItem("apiVersion") || "v1";

export const apiService = {
  // --- Boards ---
  async getBoards() {
    const version = getVersion();
    const { data } = await api.get("/boards");
    if (version === "v2") {
      return data.allBaord || []; // Note: typo 'allBaord' in backend controller
    }
    return data || [];
  },

  async createBoard(title, description = "", allowDuplicate = false) {
    const { data } = await api.post("/boards", { title, description, allowDuplicate });
    if (data && data.status) {
      return data;
    }
    return { status: "SUCCESS", board: data };
  },

  async getBoard(boardId) {
    const version = getVersion();
    if (version === "v2") {
      // There is no GET /boards/:boardId in V2 board.router.js.
      // We list all boards and find the matching one to get the details (like title).
      const { data } = await api.get("/boards");
      const boards = data.allBaord || [];
      const board = boards.find((b) => (b._id || b.id) === boardId);
      if (!board) {
        throw new Error("Tableau introuvable");
      }
      return board;
    }
    const { data } = await api.get(`/boards/${boardId}`);
    return data;
  },

  async deleteBoard(boardId) {
    const version = getVersion();
    const { data } = await api.delete(`/boards/${boardId}`);
    if (version === "v2") {
      if (data.status === "NOT_FOUND" || data.status === "UNAUTHORIZED") {
        throw new Error(data.message || "Erreur de suppression du projet");
      }
      return data.board;
    }
    return data;
  },

  async updateBoard(boardId, title, description, allowDuplicate = false) {
    const { data } = await api.patch(`/boards/${boardId}`, { title, description, allowDuplicate });
    if (data && data.status) {
      if (data.status === "NOT_FOUND" || data.status === "UNAUTHORIZED") {
        throw new Error(data.message || "Erreur de modification du projet");
      }
      return data;
    }
    return { status: "SUCCESS", board: data };
  },

  // --- Columns ---
  async getColumns(boardId) {
    const version = getVersion();
    if (version === "v2") {
      // In v2, GET /boards/:boardId maps to getAllColumnsV2Controller which returns columns with tasks
      const { data } = await api.get(`/boards/${boardId}`);
      return data.columns || [];
    }
    const { data } = await api.get(`/boards/${boardId}/columns`);
    return data || [];
  },

  async createColumn(boardId, title, color = null, allowDuplicate = false) {
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.post(`/boards/${boardId}`, {
        title,
        color,
        allowDuplicate,
      });
      if (data.status === 200 && data.action) {
        throw new Error(data.message || "Une colonne avec ce nom existe déjà.");
      }
      return data.column;
    }
    const { data } = await api.post(`/boards/${boardId}/columns`, { title, color });
    return data;
  },

  async deleteColumn(boardId, columnId) {
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.delete(`/boards/${boardId}/${columnId}`);
      if (data.status === 404) {
        throw new Error(data.message || "Colonne introuvable");
      }
      return data.column;
    }
    const { data } = await api.delete(`/boards/${boardId}/columns/${columnId}`);
    return data;
  },

  async updateColumn(boardId, columnId, title, color, category = undefined) {
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.patch(`/boards/${boardId}/${columnId}`, { title, color, category });
      if (data.status === 404) {
        throw new Error(data.message || "Colonne introuvable");
      }
      return data.column;
    }
    const { data } = await api.patch(`/boards/${boardId}/columns/${columnId}`, { title, color, category });
    return data;
  },

  async moveColumn(boardId, columnId, positionBefore, positionAfter) {
    // v1 only — PATCH /boards/:boardId/columns/:columnId
    const { data } = await api.patch(
      `/boards/${boardId}/columns/${columnId}`,
      { positionBefore, positionAfter }
    );
    return data;
  },

  async updateTask(boardId, taskId, title, description) {
    // v1 only — PATCH /boards/:boardId/tasks/:taskId
    const { data } = await api.patch(
      `/boards/${boardId}/tasks/${taskId}`,
      { title, description }
    );
    return data;
  },

  // --- Tasks ---
  async getTasks(boardId, columnId) {
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.get(`/boards/${boardId}/${columnId}`);
      if (data.status === "ERROR") {
        throw new Error(data.message || "Impossible de récupérer les tâches");
      }
      return data.tasks || [];
    }
    const { data } = await api.get(
      `/boards/${boardId}/columns/${columnId}/tasks`,
    );
    return data || [];
  },

  async createTask(boardId, columnId, title, description = "") {
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.post(`/boards/${boardId}/${columnId}`, {
        title,
        description,
      });
      if (data.status === "ERROR") {
        throw new Error(
          data.message || "Erreur lors de la création de la tâche",
        );
      }
      return data.task;
    }
    const { data } = await api.post(
      `/boards/${boardId}/columns/${columnId}/tasks`,
      { title, description },
    );
    return data;
  },

  async deleteTask(boardId, columnId, taskId) {
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.delete(
        `/boards/${boardId}/${columnId}/${taskId}`,
      );
      if (data.status === "ERROR") {
        throw new Error(
          data.message || "Erreur lors de la suppression de la tâche",
        );
      }
      return data.task;
    }
    const { data } = await api.delete(`/boards/${boardId}/tasks/${taskId}`);
    return data;
  },

  async moveTask(
    boardId,
    taskId,
    sourceColumnId,
    targetColumnId,
    newIndex,
    positionBefore,
    positionAfter,
  ) {
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.patch(
        `/boards/${boardId}/${sourceColumnId}/${taskId}`,
        {
          targetColumnId,
          positionBefore,
          positionAfter,
        },
      );
      if (data.status === "ERROR") {
        throw new Error(
          data.message || "Erreur lors du déplacement de la tâche",
        );
      }
      return data.task;
    }
    const { data } = await api.patch(
      `/boards/${boardId}/tasks/${taskId}/move`,
      {
        newColumnId: targetColumnId,
        positionBefore,
        positionAfter,
      },
    );
    return data;
  },
};
