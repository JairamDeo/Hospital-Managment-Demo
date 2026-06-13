import RoomMaster from '../models/roomMaster.model.js';
import HmsPanchakarmaProgram from '../models/hmsPanchakarmaProgram.model.js';
import HmsIpdAdmission from '../models/hmsIpdAdmission.model.js';
import { IPD_MESSAGES, PANCHAKARMA_MESSAGES } from './constants.js';

const ACTIVE_PANCHAKARMA_STATUSES = ['Starting', 'Ongoing'];
const ACTIVE_IPD_STATUS = 'Admitted';

export const countActivePanchakarmaInRoom = async (roomCode, excludeProgramId = null) => {
  const query = {
    roomCode,
    status: { $in: ACTIVE_PANCHAKARMA_STATUSES },
  };
  if (excludeProgramId) query._id = { $ne: excludeProgramId };
  return HmsPanchakarmaProgram.countDocuments(query);
};

export const countActiveIpdInRoom = async (roomCode, excludeAdmissionId = null) => {
  const query = {
    roomCode,
    status: ACTIVE_IPD_STATUS,
  };
  if (excludeAdmissionId) query._id = { $ne: excludeAdmissionId };
  return HmsIpdAdmission.countDocuments(query);
};

export const getRoomOccupancy = async (room, excludeIds = {}) => {
  const occupied =
    room.roomType === 'Panchakarma'
      ? await countActivePanchakarmaInRoom(room.code, excludeIds.programId)
      : await countActiveIpdInRoom(room.code, excludeIds.admissionId);

  const capacity = Number(room.capacity) || 1;
  const available = Math.max(0, capacity - occupied);

  return { capacity, occupied, available };
};

export const assertRoomHasCapacity = async (roomCode, roomType, excludeIds = {}) => {
  const room = await RoomMaster.findOne({ code: roomCode, active: true }).lean();
  if (!room) {
    throw new Error(
      roomType === 'IPD' ? IPD_MESSAGES.ROOM_NOT_FOUND : PANCHAKARMA_MESSAGES.ROOM_UNAVAILABLE
    );
  }
  if (room.roomType !== roomType) {
    throw new Error(
      roomType === 'IPD' ? IPD_MESSAGES.ROOM_TYPE_MISMATCH : PANCHAKARMA_MESSAGES.ROOM_UNAVAILABLE
    );
  }

  const { available } = await getRoomOccupancy(room, excludeIds);
  if (available <= 0) {
    throw new Error(
      roomType === 'IPD' ? IPD_MESSAGES.ROOM_AT_CAPACITY : PANCHAKARMA_MESSAGES.ROOM_UNAVAILABLE
    );
  }

  return room;
};

export const listRoomsWithOccupancy = async ({ roomType, activeOnly = true } = {}) => {
  const filter = {};
  if (roomType) filter.roomType = roomType;
  if (activeOnly) filter.active = true;

  const rooms = await RoomMaster.find(filter).sort({ roomNumber: 1 }).lean();

  return Promise.all(
    rooms.map(async (room) => {
      const { capacity, occupied, available } = await getRoomOccupancy(room);
      return {
        ...room,
        capacity,
        occupied,
        available,
        isFull: available <= 0,
      };
    })
  );
};
