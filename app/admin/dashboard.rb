ActiveAdmin.register_page "Dashboard" do

  menu priority: 0, label: proc{ I18n.t("active_admin.dashboard") }

  content title: proc{ I18n.t("active_admin.dashboard") } do
    columns do
       column do
         panel "Analistas Ativos" do
           ul do
           #  Doodle::User::Analyst.joins(:user_channels).where(status: 'online').map do |user|
           #    li user.name
           #  end
           end
         end
       end

       column do
         panel "Número de protocolos em cada fila" do
         end
       end
     end
  end
end
