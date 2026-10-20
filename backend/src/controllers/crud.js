import { pick } from "../utils/helpers.js";

// Builds create / list / update / remove handlers for a simple per-user model.
//   fields   - body keys the client may set
//   prepare  - (body, isUpdate) => { error } | { data }   validates and cleans the input
//   sort     - mongoose sort for the list endpoint
//   filters  - (query) => extra mongo filter for the list endpoint
export const makeCrud = (Model, { label, fields, prepare, sort = { createdAt: -1 }, filters = () => ({}) }) => {
  const fail = (res, where, error) => {
    console.error(`Error in ${where} (${label})`, error);
    if (error?.code === 11000) return res.status(409).json({ message: `That ${label} already exists` });
    return res.status(500).json({ message: "Internal server error" });
  };

  return {
    create: async (req, res) => {
      try {
        const cleaned = prepare(pick(req.body, fields), false);
        if (cleaned.error) return res.status(400).json({ message: cleaned.error });
        const doc = await Model.create({ ...cleaned.data, userId: req.userId });
        res.status(201).json(doc);
      } catch (error) {
        fail(res, "create", error);
      }
    },

    list: async (req, res) => {
      try {
        const docs = await Model.find({ userId: req.userId, ...filters(req.query) }).sort(sort);
        res.json(docs);
      } catch (error) {
        fail(res, "list", error);
      }
    },

    update: async (req, res) => {
      try {
        const cleaned = prepare(pick(req.body, fields), true);
        if (cleaned.error) return res.status(400).json({ message: cleaned.error });
        const doc = await Model.findOneAndUpdate(
          { _id: req.params.id, userId: req.userId },
          cleaned.data,
          { new: true, runValidators: true }
        );
        if (!doc) return res.status(404).json({ message: `${label} not found` });
        res.json(doc);
      } catch (error) {
        fail(res, "update", error);
      }
    },

    remove: async (req, res) => {
      try {
        const doc = await Model.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!doc) return res.status(404).json({ message: `${label} not found` });
        res.json({ message: `${label} deleted successfully` });
      } catch (error) {
        fail(res, "remove", error);
      }
    },
  };
};

export const crudRouter = (express, requireAuth, crud) => {
  const router = express.Router();
  router.use(requireAuth);
  router.post("/", crud.create);
  router.get("/", crud.list);
  router.put("/:id", crud.update);
  router.delete("/:id", crud.remove);
  return router;
};
