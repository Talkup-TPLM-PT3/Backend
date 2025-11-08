const exampleController = require("./exampleController");
const systemController = require("./systemController");

module.exports = {
  exampleController,
  systemController,
};


const exampleController = require("./exampleController");
const systemController = require("./systemController");
const { Konseling, GuruBK } = require("../models");

/**
 * @desc Get counseling history for a logged-in student with pagination
 * @route GET /api/v1/konseling/
 * @access Private (Siswa)
 */
const getRiwayatKonselingSiswa = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Extract student ID from the authenticated user object (from JWT token)
    const id_siswa = req.user.id_ref;

    if (!id_siswa) {
      // This indicates a misconfigured token or an issue with the authentication middleware.
      // The user is authenticated but lacks the necessary reference ID to proceed.
      return res.status(403).json({
        status: "Error",
        message: "Akses ditolak: ID siswa tidak ditemukan dalam sesi otentikasi.",
        data: null,
      });
    }

    const { count, rows } = await Konseling.findAndCountAll({
      where: { id_siswa: id_siswa },
      include: [
        {
          model: GuruBK,
          attributes: ["nama", "email"], // Only fetch necessary Guru BK attributes
        },
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]], // Sort by creation date in descending order
    });

    const totalData = count;
    const totalPages = Math.ceil(totalData / limit);

    // Map the results to the specified JSON format
    const data = rows.map((konseling) => ({
      id_konseling: konseling.id_konseling,
      tanggal: konseling.tanggal,
      topik: konseling.topik,
      status: konseling.status,
      catatan_siswa: konseling.catatan_siswa,
      catatan_gurubk: konseling.catatan_gurubk,
      guru_bk: konseling.GuruBK
        ? {
            id_guru_bk: konseling.id_guru_bk,
            nama: konseling.GuruBK.nama,
            email: konseling.GuruBK.email,
          }
        : null,
      createdAt: konseling.createdAt,
      updatedAt: konseling.updatedAt,
    }));

    res.status(200).json({
      status: "Success",
      message: "Riwayat konseling siswa berhasil diambil.",
      data: data,
      page: page,
      limit: limit,
      totalData: totalData,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching student counseling history:", error);
    // Prevent sensitive internal error details from being exposed in production
    const errorMessage = process.env.NODE_ENV === 'production'
      ? "Terjadi kesalahan server saat mengambil riwayat konseling."
      : error.message;

    res.status(500).json({
      status: "Error",
      message: errorMessage,
      data: null,
    });
  }
};

module.exports = {
  exampleController,
  systemController,
  getRiwayatKonselingSiswa,
};