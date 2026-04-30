import { menuAssociations } from "./menu.associations.js";
import { orderAssociations } from "./order.associations.js";

export const associations = Object.freeze([...menuAssociations, ...orderAssociations]);
