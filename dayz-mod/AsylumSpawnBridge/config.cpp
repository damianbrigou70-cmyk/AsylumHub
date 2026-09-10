class CfgPatches
{
    class AsylumSpawnBridge
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Scripts" };
    };
};

class CfgMods
{
    class AsylumSpawnBridge
    {
        dir = "AsylumSpawnBridge";
        picture = "";
        action = "";
        hideName = 1;
        hidePicture = 1;
        name = "Asylum Spawn Bridge";
        credits = "AsylumHub";
        author = "AsylumHub";
        authorID = "0";
        version = "1.0";
        extra = 0;
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };
        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "AsylumSpawnBridge/scripts/5_Mission" };
            };
        };
    };
};
