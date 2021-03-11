import { Component } from "@nova-engine/ecs";

export enum ItemType {
  Gun = "Gun";
}

export class ItemC implements Component {
  static tag = "ItemC";
  type = ItemType.Gun;
}