// Source: https://github.com/ariankordi/mii-fusion-experiments/blob/main/MiiToStudio/MiiToStudio.fu

// Generated automatically with "fut". Do not edit.

/**
 * Single-purpose class for converting Nintendo Mii formats to "Mii Studio data",
 * usable with the studio.mii.nintendo.com rendering API to get a Mii image.
 */
class MiiToStudio
{

	/**
	 * Size of Wii format Mii data (RFLCharData).
	 */
	static SIZE_WII_DATA = 74;

	/**
	 * Base size of 3DS/Wii U format Mii data.
	 * Usually 96 bytes long (FFLStoreData, Ver3StoreData).
	 */
	static SIZE3DS_WIIU_DATA = 72;

	/**
	 * Size of Switch "nn::mii::CharInfo" format.
	 */
	static SIZE_NX_CHAR_INFO = 88;

	/**
	 * Base URL of /miis/image.png API that returns a Mii image.
	 * This can also be replaced by mii-unsecure.ariankordi.net.
	 */
	static URL_BASE_IMAGE_PNG = "https://studio.mii.nintendo.com/miis/image.png?data=";
	/**
	 * Internal buffer returned by conversion methods.
	 */
	#buf = new Uint8Array(46);

	/**
	 * Gets the Mii image URL using the Mii data converted in this instance.
	 * @param width Size (square) of the image.
	 * @param allBody Whether or not to get an image of the whole body ("all_body")
	 */
	getImageUrl(width, allBody)
	{
		switch (width) {
		case 96:
		case 270:
		case 512:
			break;
		default:
			if ((width != 128 || allBody) && "https://studio.mii.nintendo.com/miis/image.png?data=".startsWith("https://studio.mii.nintendo.com/")) {
				console.log(`MiiToStudio.GetImageUrl(): Unsupported width ${width}, resetting to 512.`);
				width = 512;
			}
			break;
		}
		let dataHex = "";
		const urlData = new Uint8Array(47);
		MiiToStudio.obfuscateStudioUrl(urlData, this.#buf);
		for (let i = 0; i < 47; i++)
			dataHex += `${urlData[i].toString(16).padStart(2, "0")}`;
		let url = `https://studio.mii.nintendo.com/miis/image.png?data=${dataHex}&width=${width}&type=`;
		url += allBody ? "all_body" : "face";
		return url;
	}

	/**
	 * Decodes the input Mii data, where the type is automatically detected.
	 * 
	 * <p>Returns null if the format is not supported.
	 * Formats (3DS/Wii U):
	 * <ul>
	 * <li>96 byte FFLStoreData/nn::mii::Ver3StoreData (has CRC)</li>
	 * <li>92 byte FFLiMiiDataOfficial (in database, or kazuki-4ys ".3dsmii")</li>
	 * <li>72 byte FFLiMiiDataCore (no creator name or CRC)
	 * Formats (Wii):</li>
	 * <li>76 byte RFLStoreData (has CRC)</li>
	 * <li>74 byte RFLCharData (no CRC)
	 * Formats (Switch, Studio):</li>
	 * <li>88 byte nn::mii::CharInfo</li>
	 * <li>47 byte obfuscated studio URL data</li>
	 * <li>46 byte un-obfuscated raw "Studio Code"</li>
	 * </ul>
	 * @param dataSize Size of the input data used to detect the type.
	 * @param data Input Mii data to be converted.
	 */
	fromAnyMiiData(dataSize, data)
	{
		switch (dataSize) {
		case 96:
		case 92:
		case 72:
			return this.from3dsWiiuData(data);
		case 76:
		case 74:
			return this.fromWiiData(data);
		case 46:
			this.#buf.set(data.subarray(0, 46));
			return this.#buf;
		case 47:
			MiiToStudio.#deobfuscateStudioUrl(this.#buf, data);
			return this.#buf;
		case 88:
			return this.fromNxCharInfo(data);
		case 68:
		case 48:
			return null;
		default:
			return null;
		}
	}

	/**
	 * Verifies if the converted data in this instance is considered valid.
	 * Derived from nn::mii::detail::CharInfoRaw::IsValid,
	 * but does not return the specific reason.
	 */
	isValid()
	{
		return this.#buf[0] < 100 && this.#buf[1] < 6 && 128 > this.#buf[2] && this.#buf[3] < 7 && this.#buf[4] < 100 && this.#buf[5] < 8 && this.#buf[6] < 8 && this.#buf[7] < 60 && this.#buf[8] < 13 && this.#buf[9] < 19 && this.#buf[10] < 7 && this.#buf[11] < 100 && this.#buf[12] < 12 && this.#buf[13] < 9 && this.#buf[14] < 24 && this.#buf[15] < 13 && this.#buf[16] - 3 < 16 && this.#buf[17] < 10 && this.#buf[18] < 12 && this.#buf[19] < 12 && this.#buf[20] < 12 && this.#buf[21] < 12 && this.#buf[22] < 2 && this.#buf[23] < 100 && this.#buf[24] < 8 && this.#buf[25] < 20 && this.#buf[26] < 21 && this.#buf[27] < 100 && this.#buf[28] < 2 && this.#buf[29] < 132 && 128 > this.#buf[30] && this.#buf[31] < 9 && this.#buf[32] < 2 && this.#buf[33] < 17 && this.#buf[34] < 31 && this.#buf[35] < 7 && this.#buf[36] < 100 && this.#buf[37] < 9 && this.#buf[38] < 36 && this.#buf[39] < 19 && this.#buf[40] < 9 && this.#buf[41] < 6 && this.#buf[42] < 17 && this.#buf[43] < 9 && this.#buf[44] < 18 && this.#buf[45] < 19;
	}

	/**
	 * Decodes the input 3DS/Wii U Mii data (FFLStoreData/nn::mii::Ver3StoreData).
	 */
	from3dsWiiuData(data)
	{
		this.#buf[0] = data[66] >> 3 & 7;
		this.#buf[1] = data[66] & 7;
		this.#buf[2] = data[47];
		this.#buf[3] = data[53] >> 5;
		this.#buf[4] = (data[53] & 1) << 2 | data[52] >> 6;
		this.#buf[5] = data[54] & 31;
		this.#buf[6] = data[53] >> 1 & 15;
		this.#buf[7] = data[52] & 63;
		this.#buf[8] = (data[55] & 1) << 3 | data[54] >> 5;
		this.#buf[9] = data[55] >> 1 & 31;
		this.#buf[10] = data[57] >> 4 & 7;
		this.#buf[11] = data[56] >> 5;
		this.#buf[12] = data[58] & 31;
		this.#buf[13] = data[57] & 15;
		this.#buf[14] = data[56] & 31;
		this.#buf[15] = (data[59] & 1) << 3 | data[58] >> 5;
		this.#buf[16] = data[59] >> 1 & 31;
		this.#buf[17] = data[48] >> 5;
		this.#buf[18] = data[49] >> 4;
		this.#buf[19] = data[48] >> 1 & 15;
		this.#buf[20] = data[49] & 15;
		this.#buf[21] = data[25] >> 2 & 15;
		this.#buf[22] = data[24] & 1;
		this.#buf[23] = data[68] >> 4 & 7;
		this.#buf[24] = (data[69] & 7) * 2 | data[68] >> 7;
		this.#buf[25] = data[68] & 15;
		this.#buf[26] = data[69] >> 3;
		this.#buf[27] = data[51] & 7;
		this.#buf[28] = data[51] >> 3 & 1;
		this.#buf[29] = data[50];
		this.#buf[30] = data[46];
		this.#buf[31] = data[70] >> 1 & 15;
		this.#buf[32] = data[70] & 1;
		this.#buf[33] = (data[71] & 3) << 3 | data[70] >> 5;
		this.#buf[34] = data[71] >> 2 & 31;
		this.#buf[35] = data[63] >> 5;
		this.#buf[36] = (data[63] & 1) << 2 | data[62] >> 6;
		this.#buf[37] = data[63] >> 1 & 15;
		this.#buf[38] = data[62] & 63;
		this.#buf[39] = data[64] & 31;
		this.#buf[40] = (data[67] & 3) << 2 | data[66] >> 6;
		this.#buf[41] = data[64] >> 5;
		this.#buf[42] = data[67] >> 2 & 31;
		this.#buf[43] = (data[61] & 1) << 3 | data[60] >> 5;
		this.#buf[44] = data[60] & 31;
		this.#buf[45] = data[61] >> 1 & 31;
		MiiToStudio.#convertFieldsVer3ToNx(this.#buf);
		return this.#buf;
	}

	/**
	 * Decodes the input Wii Mii data (RFLCharData, RFLStoreData).
	 */
	fromWiiData(data)
	{
		this.#buf[0] = data[50] >> 1 & 7;
		this.#buf[1] = data[50] >> 4 & 3;
		this.#buf[2] = data[23];
		this.#buf[3] = 3;
		this.#buf[4] = data[42] >> 5;
		this.#buf[5] = data[41] >> 5 | (data[40] & 3) << 3;
		this.#buf[6] = data[42] >> 1 & 15;
		this.#buf[7] = data[40] >> 2;
		this.#buf[8] = data[43] >> 5 | (data[42] & 1) << 3;
		this.#buf[9] = data[41] & 31;
		this.#buf[10] = 3;
		this.#buf[11] = data[38] >> 5;
		this.#buf[12] = data[37] >> 6 | (data[36] & 7) << 2;
		this.#buf[13] = data[38] >> 1 & 15;
		this.#buf[14] = data[36] >> 3;
		this.#buf[15] = data[39] & 15;
		this.#buf[16] = data[39] >> 4 | (data[38] & 1) << 4;
		this.#buf[17] = data[32] >> 2 & 7;
		let faceTex = data[33] >> 6 | (data[32] & 3) << 2;
		this.#buf[18] = MiiToStudio.#FROM_WII_DATA_FACE_TEX_TABLE[faceTex * 2 + 1];
		this.#buf[19] = data[32] >> 5;
		this.#buf[20] = MiiToStudio.#FROM_WII_DATA_FACE_TEX_TABLE[faceTex * 2];
		this.#buf[21] = data[1] >> 1 & 15;
		this.#buf[22] = data[0] >> 6 & 1;
		this.#buf[23] = data[48] >> 1 & 7;
		this.#buf[24] = data[49] >> 5 | (data[48] & 1) << 3;
		this.#buf[25] = data[48] >> 4;
		this.#buf[26] = data[49] & 31;
		this.#buf[27] = data[35] >> 6 | (data[34] & 1) << 2;
		this.#buf[28] = data[35] >> 5 & 1;
		this.#buf[29] = data[34] >> 1;
		this.#buf[30] = data[22];
		this.#buf[31] = data[52] >> 3 & 15;
		this.#buf[32] = data[52] >> 7;
		this.#buf[33] = data[53] >> 1 & 31;
		this.#buf[34] = data[53] >> 6 | (data[52] & 7) << 2;
		this.#buf[35] = 3;
		this.#buf[36] = data[46] >> 1 & 3;
		this.#buf[37] = data[47] >> 5 | (data[46] & 1) << 3;
		this.#buf[38] = data[46] >> 3;
		this.#buf[39] = data[47] & 31;
		this.#buf[40] = data[51] >> 5 | (data[50] & 1) << 3;
		this.#buf[41] = data[50] >> 6;
		this.#buf[42] = data[51] & 31;
		this.#buf[43] = data[44] & 15;
		this.#buf[44] = data[44] >> 4;
		this.#buf[45] = data[45] >> 3;
		MiiToStudio.#convertFieldsVer3ToNx(this.#buf);
		return this.#buf;
	}

	/**
	 * Decodes the input Switch nn::mii::CharInfo format.
	 */
	fromNxCharInfo(data)
	{
		this.#buf[0] = data[74];
		this.#buf[1] = data[75];
		this.#buf[2] = data[42];
		this.#buf[3] = data[55];
		this.#buf[4] = data[53];
		this.#buf[5] = data[56];
		this.#buf[6] = data[54];
		this.#buf[7] = data[52];
		this.#buf[8] = data[57];
		this.#buf[9] = data[58];
		this.#buf[10] = data[62];
		this.#buf[11] = data[60];
		this.#buf[12] = data[63];
		this.#buf[13] = data[61];
		this.#buf[14] = data[59];
		this.#buf[15] = data[64];
		this.#buf[16] = data[65];
		this.#buf[17] = data[46];
		this.#buf[18] = data[48];
		this.#buf[19] = data[45];
		this.#buf[20] = data[47];
		this.#buf[21] = data[39];
		this.#buf[22] = data[40];
		this.#buf[23] = data[80];
		this.#buf[24] = data[81];
		this.#buf[25] = data[79];
		this.#buf[26] = data[82];
		this.#buf[27] = data[50];
		this.#buf[28] = data[51];
		this.#buf[29] = data[49];
		this.#buf[30] = data[41];
		this.#buf[31] = data[84];
		this.#buf[32] = data[83];
		this.#buf[33] = data[85];
		this.#buf[34] = data[86];
		this.#buf[35] = data[72];
		this.#buf[36] = data[70];
		this.#buf[37] = data[71];
		this.#buf[38] = data[69];
		this.#buf[39] = data[73];
		this.#buf[40] = data[77];
		this.#buf[41] = data[76];
		this.#buf[42] = data[78];
		this.#buf[43] = data[67];
		this.#buf[44] = data[66];
		this.#buf[45] = data[68];
		return this.#buf;
	}

	/**
	 * Common method to convert colors and other fields from
	 * 3DS/Wii U and Wii data to Switch/Studio equivalents.
	 */
	static #convertFieldsVer3ToNx(buf)
	{
		if (buf[27] == 0)
			buf[27] = 8;
		if (buf[0] == 0)
			buf[0] = 8;
		if (buf[11] == 0)
			buf[11] = 8;
		buf[36] += 19;
		buf[4] += 8;
		if (buf[23] == 0)
			buf[23] = 8;
		else if (buf[23] < 6)
			buf[23] += 13;
		if (127 < buf[2])
			buf[2] = 127;
		if (127 < buf[30])
			buf[30] = 127;
	}

	/**
	 * Obfuscates Studio data to be used in the URL.
	 * @param seed The random value to use for the obfuscation. Best left as 0.
	 */
	static obfuscateStudioUrl(dst, src = new Uint8Array(46), seed = 0)
	{
		dst[0] = seed;
		for (let i = 0; i < 46; i++) {
			let val = src[i] ^ dst[i];
			dst[i + 1] = (7 + val) % 256;
		}
	}

	/**
	 * Deobfuscates Studio URL data to raw decodable data.
	 */
	static #deobfuscateStudioUrl(dst, src)
	{
		for (let i = 0; i < 46; i++) {
			let val = (src[i + 1] - 7) % 256;
			dst[i] = val ^ src[i];
		}
	}

	static #FROM_WII_DATA_FACE_TEX_TABLE = new Uint8Array([ 0, 0, 0, 1, 0, 6, 0, 9, 5, 0, 2, 0, 3, 0, 7, 0,
		8, 0, 0, 10, 9, 0, 11, 0 ]);
}
