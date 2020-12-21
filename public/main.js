function main() {
  menu.openFile.open({ name: 'test2', passwd: 'hallo' });
  return 0;
  app.openWorkspace();

  app.workspace.addComponent(new Input("a", 100, 100));
  app.workspace.addComponent(new Input("b", 100, 300));
  app.workspace.addComponent(new LogicGate("xor", 300, 200));
  app.workspace.addComponent(new Output("z", 500, 200));

  app.workspace.connectComponents(0, 0, 2, 0);
  app.workspace.connectComponents(1, 0, 2, 1);
  // app.workspace.connectComponents(2, 0, 3, 0);

  return 0;
}