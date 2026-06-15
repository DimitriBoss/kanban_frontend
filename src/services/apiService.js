import api from "./api";

const getVersion = () => localStorage.getItem("apiVersion") || "v1";

export const apiService = {
  // --- Boards ---
  // --- Boards ---
  async getBoards() {
    const version = getVersion();
    const { data } = await api.get("/boards");
    const boards = version === "v2" ? (data.allBaord || []) : (data || []);
    
    // Filter by version (v2 boards have \u200Bv2 suffix, v1 boards have \u200Bv1 suffix or no suffix for legacy compatibility)
    const filtered = boards.filter((b) => {
      const desc = b.description || "";
      const isV2 = desc.endsWith("\u200Bv2");
      return version === "v2" ? isV2 : !isV2;
    }).map((b) => {
      // Strip marker
      if (b.description) {
        if (b.description.endsWith("\u200Bv2") || b.description.endsWith("\u200Bv1")) {
          b.description = b.description.slice(0, -3);
        }
      }
      return b;
    });

    return filtered;
  },

  async createBoard(title, description = "", allowDuplicate = false) {
    const version = getVersion();
    const marker = version === "v2" ? "\u200Bv2" : "\u200Bv1";
    const taggedDescription = `${description || ""}${marker}`;

    const { data } = await api.post("/boards", { title, description: taggedDescription, allowDuplicate });
    if (data && data.status) {
      if (data.board && data.board.description) {
        if (data.board.description.endsWith("\u200Bv2") || data.board.description.endsWith("\u200Bv1")) {
          data.board.description = data.board.description.slice(0, -3);
        }
      }
      return data;
    }
    
    let cleanBoard = null;
    if (data) {
      if (data.board) {
        if (data.board.board) {
          cleanBoard = { ...data.board.board };
        } else {
          cleanBoard = { ...data.board };
        }
      } else {
        cleanBoard = { ...data };
      }
    }

    if (cleanBoard && cleanBoard.description) {
      if (cleanBoard.description.endsWith("\u200Bv2") || cleanBoard.description.endsWith("\u200Bv1")) {
        cleanBoard.description = cleanBoard.description.slice(0, -3);
      }
    }
    return { status: "SUCCESS", board: cleanBoard };
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
      const isV2 = (board.description || "").endsWith("\u200Bv2");
      if (!isV2) {
        throw new Error("Tableau introuvable ou ce tableau n'est pas au format V2");
      }
      const cleanBoard = { ...board };
      if (cleanBoard.description) {
        cleanBoard.description = cleanBoard.description.slice(0, -3);
      }
      return cleanBoard;
    }
    const { data } = await api.get(`/boards/${boardId}`);
    if (data) {
      const isV2 = (data.description || "").endsWith("\u200Bv2");
      if (isV2) {
        throw new Error("Ce tableau appartient à la version V2. Veuillez basculer vers la version V2.");
      }
      if (data.description) {
        if (data.description.endsWith("\u200Bv1")) {
          data.description = data.description.slice(0, -3);
        }
      }
    }
    return data;
  },

  async deleteBoard(boardId) {
    const version = getVersion();
    const { data } = await api.delete(`/boards/${boardId}`);
    if (version === "v2") {
      if (data.status === "NOT_FOUND" || data.status === "UNAUTHORIZED") {
        throw new Error(data.message || "Erreur de suppression du projet");
      }
      const cleanBoard = { ...data.board };
      if (cleanBoard.description) {
        if (cleanBoard.description.endsWith("\u200Bv2") || cleanBoard.description.endsWith("\u200Bv1")) {
          cleanBoard.description = cleanBoard.description.slice(0, -3);
        }
      }
      return cleanBoard;
    }
    return data;
  },

  async updateBoard(boardId, title, description, allowDuplicate = false) {
    const version = getVersion();
    const marker = version === "v2" ? "\u200Bv2" : "\u200Bv1";
    const taggedDescription = `${description || ""}${marker}`;

    const { data } = await api.patch(`/boards/${boardId}`, { title, description: taggedDescription, allowDuplicate });
    if (data && data.status) {
      if (data.status === "NOT_FOUND" || data.status === "UNAUTHORIZED") {
        throw new Error(data.message || "Erreur de modification du projet");
      }
      if (data.board && data.board.description) {
        if (data.board.description.endsWith("\u200Bv2") || data.board.description.endsWith("\u200Bv1")) {
          data.board.description = data.board.description.slice(0, -3);
        }
      }
      return data;
    }
    
    let cleanBoard = null;
    if (data) {
      if (data.board) {
        if (data.board.board) {
          cleanBoard = { ...data.board.board };
        } else {
          cleanBoard = { ...data.board };
        }
      } else {
        cleanBoard = { ...data };
      }
    }

    if (cleanBoard && cleanBoard.description) {
      if (cleanBoard.description.endsWith("\u200Bv2") || cleanBoard.description.endsWith("\u200Bv1")) {
        cleanBoard.description = cleanBoard.description.slice(0, -3);
      }
    }
    return { status: "SUCCESS", board: cleanBoard };
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
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.patch(
        `/boards/${boardId}/${columnId}`,
        { positionBefore, positionAfter }
      );
      if (data.status === 404) {
        throw new Error(data.message || "Colonne introuvable");
      }
      return data.column;
    }
    // v1 only — PATCH /boards/:boardId/columns/:columnId
    const { data } = await api.patch(
      `/boards/${boardId}/columns/${columnId}`,
      { positionBefore, positionAfter }
    );
    return data;
  },

  async updateTask(boardId, taskId, title, description, columnId = null) {
    const version = getVersion();
    if (version === "v2") {
      const { data } = await api.patch(
        `/boards/${boardId}/${columnId}/${taskId}`,
        { title, description }
      );
      if (data.status === "ERROR") {
        throw new Error(data.message || "Erreur lors de la mise à jour de la tâche");
      }
      return data.task;
    }
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
