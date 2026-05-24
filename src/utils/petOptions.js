export const PET_BREEDS = {
  1: ['中华田园猫', '英国短毛猫', '美国短毛猫', '布偶猫', '暹罗猫', '橘猫', '加菲猫', '缅因猫', '其他'],
  2: ['中华田园犬', '泰迪', '金毛', '拉布拉多', '柯基', '比熊', '博美', '边牧', '哈士奇', '其他']
}

export const getPetBreedOptions = (type) => PET_BREEDS[Number(type)] || []
