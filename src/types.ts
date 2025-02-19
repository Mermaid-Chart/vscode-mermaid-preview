// Define your own version of MCProject
export interface MCProject {
  id: string;
  title: string;
  parentID?: string; // Add parentID here
  // Add other properties that you expect from the SDK's MCProject
}