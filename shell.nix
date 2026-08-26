{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    nodejs_22
    nodePackages.pnpm
    rustc
    cargo
    wasm-pack
  ];
}
