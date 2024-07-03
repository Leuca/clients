import { ScrollingModule } from "@angular/cdk/scrolling";
import { Meta, moduleMetadata, StoryObj } from "@storybook/angular";

import { CheckboxModule } from "../checkbox";
import { countries } from "../form/countries";

import { SelectableTableDataSource } from "./selectable-table-data-source";
import { TableDataSource } from "./table-data-source";
import { TableModule } from "./table.module";

export default {
  title: "Component Library/Table",
  decorators: [
    moduleMetadata({
      imports: [TableModule, ScrollingModule, CheckboxModule],
    }),
  ],
  argTypes: {
    alignRowContent: {
      options: ["top", "middle", "bottom", "baseline"],
      control: { type: "select" },
    },
  },
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/Zt3YSeb6E6lebAffrNLa0h/Tailwind-Component-Library?node-id=1881%3A18371",
    },
  },
} as Meta;

type Story = StoryObj;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <bit-table>
        <ng-container header>
          <tr>
            <th bitCell>Header 1</th>
            <th bitCell>Header 2</th>
            <th bitCell>Header 3</th>
          </tr>
        </ng-container>
        <ng-template body>
          <tr bitRow [alignContent]="alignRowContent">
            <td bitCell>Cell 1</td>
            <td bitCell>Cell 2 <br> Multiline Cell</td>
            <td bitCell>Cell 3</td>
          </tr>
          <tr bitRow [alignContent]="alignRowContent">
            <td bitCell>Cell 4</td>
            <td bitCell>Cell 5</td>
            <td bitCell>Cell 6</td>
          </tr>
          <tr bitRow [alignContent]="alignRowContent">
            <td bitCell>Cell 7 <br> Multiline Cell</td>
            <td bitCell>Cell 8</td>
            <td bitCell>Cell 9</td>
          </tr>
        </ng-template>
      </bit-table>
    `,
  }),
  args: {
    alignRowContent: "middle",
  },
};

const data = new TableDataSource<{ id: number; name: string; other: string }>();

data.data = [...Array(5).keys()].map((i) => ({
  id: i,
  name: `name-${i}`,
  other: `other-${i}`,
}));

export const DataSource: Story = {
  render: (args) => ({
    props: {
      dataSource: data,
      sortFn: (a: any, b: any) => a.id - b.id,
    },
    template: `
      <bit-table [dataSource]="dataSource">
        <ng-container header>
          <tr>
            <th bitCell bitSortable="id" default>Id</th>
            <th bitCell bitSortable="name">Name</th>
            <th bitCell bitSortable="other" [fn]="sortFn">Other</th>
          </tr>
        </ng-container>
        <ng-template body let-rows$>
          <tr bitRow *ngFor="let r of rows$ | async">
            <td bitCell>{{ r.id }}</td>
            <td bitCell>{{ r.name }}</td>
            <td bitCell>{{ r.other }}</td>
          </tr>
        </ng-template>
      </bit-table>
    `,
  }),
};

const data2 = new TableDataSource<{ id: number; name: string; other: string }>();

data2.data = [...Array(100).keys()].map((i) => ({
  id: i,
  name: `name-${i}`,
  other: `other-${i}`,
}));

export const Scrollable: Story = {
  render: (args) => ({
    props: {
      dataSource: data2,
      sortFn: (a: any, b: any) => a.id - b.id,
    },
    template: `
      <cdk-virtual-scroll-viewport scrollWindow itemSize="47">
        <bit-table [dataSource]="dataSource">
          <ng-container header>
            <tr>
              <th bitCell bitSortable="id" default>Id</th>
              <th bitCell bitSortable="name">Name</th>
              <th bitCell bitSortable="other" [fn]="sortFn">Other</th>
            </tr>
          </ng-container>
          <ng-template body let-rows$>
            <tr bitRow *cdkVirtualFor="let r of rows$">
              <td bitCell>{{ r.id }}</td>
              <td bitCell>{{ r.name }}</td>
              <td bitCell>{{ r.other }}</td>
            </tr>
          </ng-template>
        </bit-table>
      </cdk-virtual-scroll-viewport>
    `,
  }),
};

const data3 = new TableDataSource<{ value: string; name: string }>();

// Chromatic has a max page size, lowering the number of entries to ensure we don't hit it
data3.data = countries.slice(0, 100);

export const Filterable: Story = {
  render: (args) => ({
    props: {
      dataSource: data3,
      sortFn: (a: any, b: any) => a.id - b.id,
    },
    template: `
      <input type="search" placeholder="Search" (input)="dataSource.filter = $event.target.value" />
      <cdk-virtual-scroll-viewport scrollWindow itemSize="47">
        <bit-table [dataSource]="dataSource">
          <ng-container header>
            <tr>
              <th bitCell bitSortable="name" default>Name</th>
              <th bitCell bitSortable="value" width="120px">Value</th>
            </tr>
          </ng-container>
          <ng-template body let-rows$>
            <tr bitRow *cdkVirtualFor="let r of rows$">
              <td bitCell>{{ r.name }}</td>
              <td bitCell>{{ r.value }}</td>
            </tr>
          </ng-template>
        </bit-table>
      </cdk-virtual-scroll-viewport>
    `,
  }),
};

const data4 = new TableDataSource<{ name: string }>();

data4.data = [...Array(5).keys()].map((i) => ({
  name: i % 2 == 0 ? `name-${i}`.toUpperCase() : `name-${i}`.toLowerCase(),
}));

export const VariableCase: Story = {
  render: (args) => ({
    props: {
      dataSource: data4,
    },
    template: `
      <bit-table [dataSource]="dataSource">
        <ng-container header>
          <tr>
            <th bitCell bitSortable="name" default>Name</th>
          </tr>
        </ng-container>
        <ng-template body let-rows$>
          <tr bitRow *ngFor="let r of rows$ | async">
            <td bitCell>{{ r.name }}</td>
          </tr>
        </ng-template>
      </bit-table>
    `,
  }),
};

const data5 = new SelectableTableDataSource<{ id: number; name: string; other: string }>();

data5.data = [...Array(5).keys()].map((i) => ({
  id: i,
  name: `name-${i}`,
  other: `other-${i}`,
}));
// TODO: reimplement this functionality
// data5.selection.canSelect = (row: { id: number }) => row.id !== 2;

export const Selectable: Story = {
  render: (args) => ({
    props: {
      dataSource: data5,
      sortFn: (a: any, b: any) => a.id - b.id,
    },
    template: `
      <bit-table [dataSource]="dataSource">
        <ng-container header>
          <tr>
            <th bitCell bitSelectAll></th>
            <th bitCell bitSortable="id" default>Id</th>
            <th bitCell bitSortable="name">Name</th>
            <th bitCell bitSortable="other" [fn]="sortFn">Other</th>
          </tr>
        </ng-container>
        <ng-template body let-rows$>
          <tr bitRow *ngFor="let r of rows$ | async">
            <td bitCell [bitSelectRow]="r"></td>
            <td bitCell>{{ r.id }}</td>
            <td bitCell>{{ r.name }}</td>
            <td bitCell>{{ r.other }}</td>
          </tr>
        </ng-template>
      </bit-table>

      <ul>
        <li *ngFor="let r of dataSource.selection.selected">{{ r.id }} - {{ r.name }}</li>
      </ul>
    `,
  }),
};
