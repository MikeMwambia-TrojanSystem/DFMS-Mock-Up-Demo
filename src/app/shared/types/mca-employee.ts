import { BasicDocument } from './_global';

export class McaEmployee extends BasicDocument {
  authorName: string;
  dateCreated: string;
  name: string;
  phoneNumber: string;
  politicalParty: string;
  positionStatus: string;
  profilePic: string;
  publishState: boolean;
  published: boolean;
  termOfService: string;
  ward: string;
  wardId: string;
  _id: string;

  //Missing
  group: string;
  verified: boolean;
  assemblyId: string;
  signature: string;
  status: string;
}

// export class McaEmployee extends BasicDocument {
//   _id: string;
//   assemblyId: string;
//   commiteesInvolved: string[];
//   group: string;
//   name: string;
//   phoneNumber: {
//     number: string;
//     verified: string;
//   };
//   politicalParty: string;
//   positionStatus: string;
//   profilePic: string;
//   signature: string;
//   status: boolean;
//   termOfService: string;
//   dateCreated: string;
//   ward: {
//     wardId: string;
//     wardName: string;
//   };
//   createdAt: string;
//   updatedAt: string;
// }

export class McaPost {
  name: string;
  group: string;
  phoneNumber: string;
  verified: boolean;
  dateCreated: string;
  assemblyId: string;
  profilePic: string;
  termOfService: string;
  positionStatus: string;
  politicalParty: string;
  ward: string;
  signature: string;
  status: string;
  wardId: string;
}
