using System;
using System.Threading.Tasks;

namespace RunTheGlobe
{
  class Program
  {
    static async Task Main(string[] args)
    {
      await ActivityDownloader.Run();
    }
  }
}
