const Studio = require("../models/Studio");
const Seat = require("../models/Seat");

// GET ALL STUDIOS
exports.getStudios = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    const studios = await Studio.find(query).populate("cinema");

    res.status(200).json({
      success: true,
      count: studios.length,
      data: studios,
    });
  } catch (error) {
    next(error);
  }
};

// GET STUDIO BY ID
exports.getStudioById = async (req, res, next) => {
  try {
    const studio = await Studio.findById(req.params.id).populate("cinema");

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    res.status(200).json({
      success: true,
      data: studio,
    });
  } catch (error) {
    next(error);
  }
};

// CREATE STUDIO
exports.createStudio = async (req, res, next) => {
  try {
    const newStudio = new Studio(req.body);
    const savedStudio = await newStudio.save();

    const { rows, seatsPerRow } = savedStudio;
    const seatsToCreate = [];

    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);

      for (let c = 1; c <= seatsPerRow; c++) {
        seatsToCreate.push({
          studioId: savedStudio._id,
          code: `${rowLetter}${c}`,
        });
      }
    }

    await Seat.insertMany(seatsToCreate);

    res.status(201).json({
      success: true,
      message: "Studio and seats generated successfully!",
      data: savedStudio,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE STUDIO
exports.updateStudio = async (req, res, next) => {
  try {
    const studio = await Studio.findById(req.params.id);

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    Object.assign(studio, req.body);
    await studio.save();

    // Hapus semua seat lama
    await Seat.deleteMany({
      studioId: studio._id,
    });

    // Generate seat baru
    const seats = [];

    for (let r = 0; r < studio.rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);

      for (let c = 1; c <= studio.seatsPerRow; c++) {
        seats.push({
          studioId: studio._id,
          code: `${rowLetter}${c}`,
        });
      }
    }

    await Seat.insertMany(seats);

    res.status(200).json({
      success: true,
      data: studio,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE STUDIO
exports.deleteStudio = async (req, res, next) => {
  try {
    const studio = await Studio.findById(req.params.id);

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    // Hapus semua seat
    await Seat.deleteMany({
      studioId: studio._id,
    });

    // Hapus studio
    await Studio.findByIdAndDelete(studio._id);

    res.status(200).json({
      success: true,
      message: "Studio dan seluruh seat berhasil dihapus",
    });
  } catch (error) {
    next(error);
  }
};
