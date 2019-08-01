workflow "Publish" {
  on       = "push"

  resolves = [
    "publish"
  ]
}

action "tag-filter" {
  uses = "actions/bin/filter@master"
  args = "tag"
}

action "install" {
  uses  = "actions/npm@master"

  args  = [
    "install --unsafe-perm"
  ]

  needs = [
    "tag-filter"
  ]
}

action "build-previewer" {
  uses  = "./previewer/actions/build"
  args  = "cleanup"

  needs = [
    "tag-filter"
  ]
}

action "build-previewer-local" {
  uses  = "./previewer/actions/build"

  needs = [
  ]

  args  = [
  ]
}

action "publish" {
  uses    = "lannonbr/vsce-action@master"
  args    = "publish -p $VSCE_TOKEN"

  needs   = [
    "build-previewer",
    "install"
  ]

  secrets = [
    "VSCE_TOKEN"
  ]
}
