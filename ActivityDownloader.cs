using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using RestSharp.Portable;
using StravaSharp;

namespace RunTheGlobe
{
  class ActivityDownloader
  {
    public static async Task Run()
    {
      var access = File.ReadAllText("/Users/walshca/.rtg/access");

      var authenticator = new StaticAuthenticator{
        AccessToken = access,
      };
      var client = new Client(authenticator);
      var me = await client.Athletes.GetCurrent();
      Console.Error.WriteLine(me.CreatedAt);
      // TODO that worked

      // TODO but this doesn't. Is the scope wrong?
      Console.Error.WriteLine("Getting Activities");
      // var activities = await client.Activities.GetAthleteActivities(DateTime.MaxValue, new DateTime(2020, 12, 1));
      // foreach (var a in activities) {
      //   Console.Error.WriteLine(a.Name);
      //   Console.Error.WriteLine(a.Map.SummaryPolyline);
      //   Console.Error.WriteLine();
      // }
    }

    class StaticAuthenticator : IAuthenticator
    {
      public string AccessToken { get; set; }

      public bool CanPreAuthenticate(IRestClient client, IRestRequest request, ICredentials credentials) => true;
      public Task PreAuthenticate(IRestClient client, IRestRequest request, ICredentials credentials)
      {
        Console.Error.WriteLine("Adding " + AccessToken);
        return Task.Run(() =>
        {
          request.AddHeader("Authorization", "Bearer " + AccessToken);
        });
      }

      public bool CanPreAuthenticate(IHttpClient client, IHttpRequestMessage request, ICredentials credentials) => false;
      public Task PreAuthenticate(IHttpClient client, IHttpRequestMessage request, ICredentials credentials) => throw new NotImplementedException();

      public bool CanHandleChallenge(IHttpClient client, IHttpRequestMessage request, ICredentials credentials, IHttpResponseMessage response) => false;
      public Task HandleChallenge(IHttpClient client, IHttpRequestMessage request, ICredentials credentials, IHttpResponseMessage response) => throw new NotImplementedException();
    }
  }
}
