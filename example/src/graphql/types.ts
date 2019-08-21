import {GooglePerson, AccountType} from './scalars';

export interface Contact {
  id: number;
  name: string;
  google: GooglePerson;
}

export interface Account {
  id: number;
  type: AccountType;
  value: string;
}
