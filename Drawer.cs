using System.Collections.Generic;
using System.Drawing;

namespace RunTheGlobe
{
  static class Drawer
  {
    public static Bitmap CombineTiles(int x, int y, int maxX, int maxY, int z)
    {
      var dx = maxX - x;
      var dy = maxY - y;
      var combined = new Bitmap(512 * dx, 512 * dy);
      using (var gfx = Graphics.FromImage(combined)) {
        for (var yy = 0; yy < dy; ++yy) {
          for (var xx = 0; xx < dx; ++xx) {
            using (var b = FileDatabase.GetHeatmap(xx + x, yy + y, z)) {
              if (b != null) gfx.DrawImage(b, xx * 512, yy * 512);
            }
          }
        }
      }
      return combined;
    }

    public static void Draw(Bitmap img, List<Point> points) {
      throw new System.NotImplementedException(); //TODO
    }
  }
}
