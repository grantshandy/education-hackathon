{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    # AWS
    aws-sam-cli
    awscli2

    # Backend
    python312
    python312Packages.pip
    python312Packages.boto3

    # Frontend
    nodejs_22

    # Dev tools
    jq
    curl
    yt-dlp
    ffmpeg
  ];
}
