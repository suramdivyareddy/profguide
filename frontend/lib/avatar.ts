import { createAvatar } from '@dicebear/core';
import { croodles } from '@dicebear/collection';

export const generateAvatar = async (seed: string) => {
  const avatar = createAvatar(croodles, {
    seed,
    backgroundColor: ['ffffff'], // White background
    radius: 50
  });
  return await avatar.toDataUri();
}; 