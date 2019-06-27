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

action "publish" {
    uses    = "lannonbr/vsce-action@master"
    args    = "publish -p $VSCE_TOKEN"

    needs   = [
        "install"
    ]

    secrets = [
        "VSCE_TOKEN"
    ]
}
