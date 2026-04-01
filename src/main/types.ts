export type FileNode = {
  type: "file";
  name: string;
  path: string;
  size: number;
};

export type DirNode = {
  type: "dir";
  name: string;
  path: string;
  children: TreeNode[];
};

export type TreeNode = FileNode | DirNode;

export type ProjectState = {
  rootPath: string | null;
  projectName: string | null;
};
