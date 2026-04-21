export type JneDestination = {
  id: number;
  provinceName: string;
  cityName: string;
  districtName: string;
  subdistrictName: string;
  zipCode: string;
  tariffCode: string;
  createdAt: string;
};

export type JneProvince = {
  provinceName: string;
};

export type JneCity = {
  cityName: string;
};

export type JneDistrict = {
  districtName: string;
};

export type JneSubdistrict = {
  id: number;
  subdistrictName: string;
  zipCode: string;
  tariffCode: string;
};
