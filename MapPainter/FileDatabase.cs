using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;

namespace RunTheGlobe
{
  // TODO(app) this should be a real database -- postgre or something
  static class FileDatabase
  {
    static readonly string rtgDb = Path.Combine(Program.rtg, "db");

    public static string? GetPolyline(long id)
    {
      var path = Path.Combine(rtgDb, "activities", id + ".txt");
      if (!File.Exists(path)) return null;
      return File.ReadAllText(path);
    }

    public static IList<long> GetPolylines()
    {
      var path = Path.Combine(rtgDb, "activities");
      return Directory.EnumerateFiles(path).Select(file => long.Parse(Path.GetFileNameWithoutExtension(file))).ToList();
    }

    public static void SetPolyline(long id, string polyline)
    {
      var path = Path.Combine(rtgDb, "activities", id + ".txt");
      File.WriteAllText(path, polyline);
    }

    static string GetHeatmapPath(string color, int tileX, int tileY, int z) =>
      Path.Combine(rtgDb, "tiles", color, z.ToString(), tileX.ToString(), tileY + ".png");

    public static Bitmap? GetHeatmap(string color, int tileX, int tileY, int z)
    {
      var path = GetHeatmapPath(color, tileX, tileY, z);
      if (File.Exists(path)) return new Bitmap(path);
      return null;
    }

    public static void SetHeatmap(string color, int tileX, int tileY, int z, Bitmap image)
    {
      var path = GetHeatmapPath(color, tileX, tileY, z);
      Directory.CreateDirectory(Path.GetDirectoryName(path) ?? throw new ArgumentNullException());
      image.Save(path);
    }
  }
}
