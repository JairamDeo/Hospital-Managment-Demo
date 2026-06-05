import HmsPanchakarmaProgram from '../models/hmsPanchakarmaProgram.model.js';

export const generatePanchakarmaCode = async () => {
  const last = await HmsPanchakarmaProgram.findOne({ programCode: { $regex: /^PK-\d{3}$/ } })
    .sort({ programCode: -1 })
    .select('programCode')
    .lean();

  let seq = 1;
  if (last?.programCode) {
    const match = last.programCode.match(/^PK-(\d{3})$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `PK-${String(seq).padStart(3, '0')}`;
};
