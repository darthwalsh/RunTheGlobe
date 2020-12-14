using System;
using System.Drawing;
using System.IO;

namespace RunTheGlobe
{
  // TODO(app) this should be a real database -- postgre or something
  static class FileDatabase
  {
    static readonly string rtgDb = Path.Combine(Program.rtg, "db");

    public static string GetPolyline(long id)
    {
      var path = Path.Combine(rtgDb, "activities", id + ".txt");
      if (!File.Exists(path))
      {
        return null;
      }
      return File.ReadAllText(path);
    }

    public static void SetPolyline(long id, string polyline)
    {
      var path = Path.Combine(rtgDb, "activities", id + ".txt");
      File.WriteAllText(path, polyline);
    }

    public static Bitmap GetHeatmap(int tileX, int tileY, int z) {
      var path = Path.Combine(rtgDb, "tiles", z.ToString(), tileX.ToString(), tileY + ".png");
      if (File.Exists(path)) return new Bitmap(path);
      var blank = new Bitmap(512, 512);
      using (Graphics gfx = Graphics.FromImage(blank))
      {
        gfx.Clear(Color.Transparent);
      }
      return blank;
    }
  }
}
